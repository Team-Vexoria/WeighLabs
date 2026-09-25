import { useState } from 'react'
import type { NawiScaleConfig, TestPayload } from '../../../../shared'

/* Reusable labeled field, styled to match the existing design tokens */
const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    options,
    value,
    onChange,
}: {
    label: string
    name: string
    type?: string
    placeholder?: string
    options?: string[]
    value?: string
    onChange?: (name: string, value: string) => void
}) => {
    const set = (v: string) => onChange?.(name, v)
    const fieldClass =
        'rounded-ui border dark:border-main/10 border-main-dark/10 bg-white dark:bg-main-dark text-main-dark dark:text-main p-1.5 text-sm outline-none focus:border-main-dark/30 dark:focus:border-main/30'
    return (
        <div className="flex flex-col gap-y-1">
            <label htmlFor={name} className="text-sm opacity-70">
                {label}
            </label>
            {options ? (
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={fieldClass}
                >
                    <option value="" className="bg-white dark:bg-main-dark text-main-dark dark:text-main">
                        Select {label.toLowerCase()}
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="bg-white dark:bg-main-dark text-main-dark dark:text-main">
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={fieldClass}
                />
            )}
        </div>
    )
}

interface FormState {
    [key: string]: string
}

const initialForm: FormState = {
    instrumentType: '',
    modelDesignation: '',
    serialNumber: '',
    accuracyClass: '',
    maxCapacity: '',
    minCapacity: '',
    verificationInterval: '',
    actualInterval: '',
    numberOfIntervals: '',
    manufacturerName: '',
    manufacturerAddress: '',
    manufacturerCountry: '',
    manufacturerContact: '',
    operatorName: '',
    operatorLicenseNumber: '',
    testDate: '',
    operatorSignature: '',
    labName: '',
    labAccreditationNumber: '',
    labLocation: '',
    labConditions: '',
}

const accuracyClassEnum: Record<string, number> = {
    'Class I (Special)': 1,
    'Class II (High)': 2,
    'Class III (Medium)': 3,
    'Class IIII (Ordinary)': 4,
}

function num(value: string): number | null {
    const n = Number(value)
    return value !== '' && Number.isFinite(n) ? n : null
}

function buildConfig(form: FormState): NawiScaleConfig | null {
    const max = num(form.maxCapacity)
    const e = num(form.verificationInterval)
    if (max === null || e === null) return null
    return {
        serialNumber: form.serialNumber || 'NAWI',
        model: form.modelDesignation || 'UNKNOWN',
        accuracyClass: accuracyClassEnum[form.accuracyClass] ?? 3,
        unit: 1,
        maxCapacity: max,
        minCapacity: num(form.minCapacity) ?? 0,
        verificationInterval: e,
        actualInterval: num(form.actualInterval) ?? e / 5,
        numberOfIntervals: num(form.numberOfIntervals) ?? Math.round(max / e),
    }
}

function buildPayload(form: FormState): TestPayload {
    return {
        instrument: {
            'Instrument Type': form.instrumentType,
            'Model Designation': form.modelDesignation,
            'Serial Number': form.serialNumber,
            'Accuracy Class': form.accuracyClass,
            'Maximum Capacity (Max)': form.maxCapacity,
            'Minimum Capacity (Min)': form.minCapacity,
            'Verification Scale Interval (e)': form.verificationInterval,
            'Actual Scale Interval (d)': form.actualInterval,
            'Number of Verification Intervals (n)': form.numberOfIntervals,
        },
        manufacturer: {
            'Manufacturer Name': form.manufacturerName,
            'Address': form.manufacturerAddress,
            'Country': form.manufacturerCountry,
            'Contact / Email': form.manufacturerContact,
        },
        operator: {
            'Operator Name': form.operatorName,
            'Certification / License No.': form.operatorLicenseNumber,
            'Test Date': form.testDate,
            'Signature / Initials': form.operatorSignature,
        },
        laboratory: {
            'Laboratory Name': form.labName,
            'Accreditation No.': form.labAccreditationNumber,
            'Location': form.labLocation,
            'Ambient Conditions (Temp / Humidity)': form.labConditions,
        },
        config: buildConfig(form),
        frames: [],
        summary: null,
    }
}

export function CreateTestTab() {
    const [form, setForm] = useState<FormState>(initialForm)
    const [saving, setSaving] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const update = (name: string, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }))
        setNotice(null)
    }

    const persist = async (label: string) => {
        setSaving(true)
        setError(null)
        setNotice(null)
        try {
            const payload = buildPayload(form)
            const serial = form.serialNumber || 'NAWI'
            const date = form.testDate ? new Date(form.testDate + 'T00:00:00') : new Date()
            const record = await window.tests?.create({
                fileName: `Test ${serial} - ${date.toLocaleDateString('en-GB')}`,
                manufacturerId: form.manufacturerName || serial,
                createdAt: new Date().toISOString(),
                payload,
            })
            if (record) {
                setNotice(`"${record.fileName}" ${label} — it now appears under View Reports.`)
                setForm(initialForm)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="w-full px-5 py-2 font-ui flex flex-col">
            <h1 className="text-3xl mb-5">Create a Test Instance</h1>

            {notice && (
                <div className="mb-2 p-ui rounded-ui border border-green-500/40 bg-green-500/10 text-green-500 dark:text-green-400">
                    {notice}
                </div>
            )}
            {error && (
                <div className="mb-2 p-ui rounded-ui border border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* INPUT INSTRUMENT INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Instrument Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 flex flex-col rounded-ui gap-y-3 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Instrument Type" name="instrumentType" placeholder="e.g. Electronic Scale" value={form.instrumentType} onChange={update} />
                        <Field label="Model Designation" name="modelDesignation" placeholder="e.g. XK3190-A12E" value={form.modelDesignation} onChange={update} />
                        <Field label="Serial Number" name="serialNumber" placeholder="e.g. SN-00123456" value={form.serialNumber} onChange={update} />
                        <Field
                            label="Accuracy Class"
                            name="accuracyClass"
                            options={['Class I (Special)', 'Class II (High)', 'Class III (Medium)', 'Class IIII (Ordinary)']}
                            value={form.accuracyClass}
                            onChange={update}
                        />
                    </div>
                    <div className="flex-1 flex flex-col rounded-ui gap-y-3 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Maximum Capacity (Max)" name="maxCapacity" type="number" placeholder="e.g. 30" value={form.maxCapacity} onChange={update} />
                        <Field label="Minimum Capacity (Min)" name="minCapacity" type="number" placeholder="e.g. 0.2" value={form.minCapacity} onChange={update} />
                        <Field label="Verification Scale Interval (e)" name="verificationInterval" type="number" placeholder="e.g. 0.01" value={form.verificationInterval} onChange={update} />
                        <Field label="Actual Scale Interval (d)" name="actualInterval" type="number" placeholder="e.g. 0.01" value={form.actualInterval} onChange={update} />
                        <Field label="Number of Verification Intervals (n = Max/e)" name="numberOfIntervals" type="number" placeholder="e.g. 3000" value={form.numberOfIntervals} onChange={update} />
                    </div>
                </div>
            </div>

            {/* INPUT MANUFACTURER INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Manufacturer Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Manufacturer Name" name="manufacturerName" placeholder="e.g. Mettler Toledo" value={form.manufacturerName} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Address" name="manufacturerAddress" placeholder="Street, City, Postal Code" value={form.manufacturerAddress} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Country" name="manufacturerCountry" placeholder="e.g. Switzerland" value={form.manufacturerCountry} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Contact / Email" name="manufacturerContact" type="email" placeholder="contact@company.com" value={form.manufacturerContact} onChange={update} />
                    </div>
                </div>
            </div>

            {/* INPUT OPERATOR INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Operator Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Operator Name" name="operatorName" placeholder="Full name" value={form.operatorName} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Certification / License No." name="operatorLicenseNumber" placeholder="e.g. CERT-2026-0456" value={form.operatorLicenseNumber} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Test Date" name="testDate" type="date" value={form.testDate} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Signature / Initials" name="operatorSignature" placeholder="Type initials" value={form.operatorSignature} onChange={update} />
                    </div>
                </div>
            </div>

            {/* INPUT LABORATORY INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Laboratory Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Laboratory Name" name="labName" placeholder="e.g. National Metrology Lab" value={form.labName} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Accreditation No." name="labAccreditationNumber" placeholder="e.g. ISO/IEC 17025 - 00123" value={form.labAccreditationNumber} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Location" name="labLocation" placeholder="City, Country" value={form.labLocation} onChange={update} />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Ambient Conditions (Temp / Humidity)" name="labConditions" placeholder="e.g. 20°C / 50% RH" value={form.labConditions} onChange={update} />
                    </div>
                </div>
            </div>

            <div className="flex gap-1 ml-auto mt-2">
                <button
                    className="p-2 button border dark:border-main/5 border-main-dark/5"
                    disabled={saving}
                    onClick={() => persist('saved for later')}
                >
                    Save for Later
                </button>
                <button
                    className="p-2 button border dark:border-main/5 border-main-dark/5"
                    disabled={saving}
                    onClick={() => persist('created')}
                >
                    Create Test
                </button>
            </div>
        </div>
    )
}