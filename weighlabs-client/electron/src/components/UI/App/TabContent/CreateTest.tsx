import React from 'react'

/* Reusable labeled field, styled to match the existing design tokens */
const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    options,
}: {
    label: string
    name: string
    type?: string
    placeholder?: string
    options?: string[]
}) => (
    <div className="flex flex-col gap-y-1">
        <label htmlFor={name} className="text-sm opacity-70">
            {label}
        </label>
        {options ? (
            <select
                id={name}
                name={name}
                className="rounded-ui border dark:border-main/10 border-main-dark/10 bg-white dark:bg-main-dark text-main-dark dark:text-main p-1.5 text-sm outline-none focus:border-main-dark/30 dark:focus:border-main/30"
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
                className="rounded-ui border dark:border-main/10 border-main-dark/10 bg-transparent p-1.5 text-sm outline-none focus:border-main-dark/30 dark:focus:border-main/30"
            />
        )}
    </div>
)

export const createTestTabContent: React.ReactNode = (
    <>
        <div className="w-full px-10 py-5 font-ui flex flex-col">
            <h1 className="text-3xl mb-5">Create a Test Instance</h1>

            {/* INPUT INSTRUMENT INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Instrument Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 flex flex-col rounded-ui gap-y-3 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Instrument Type" name="instrumentType" placeholder="e.g. Electronic Scale" />
                        <Field label="Model Designation" name="modelDesignation" placeholder="e.g. XK3190-A12E" />
                        <Field label="Serial Number" name="serialNumber" placeholder="e.g. SN-00123456" />
                        <Field
                            label="Accuracy Class"
                            name="accuracyClass"
                            options={['Class I (Special)', 'Class II (High)', 'Class III (Medium)', 'Class IIII (Ordinary)']}
                        />
                    </div>
                    <div className="flex-1 flex flex-col rounded-ui gap-y-3 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Maximum Capacity (Max)" name="maxCapacity" type="number" placeholder="e.g. 30" />
                        <Field label="Minimum Capacity (Min)" name="minCapacity" type="number" placeholder="e.g. 0.2" />
                        <Field label="Verification Scale Interval (e)" name="verificationInterval" type="number" placeholder="e.g. 0.01" />
                        <Field label="Actual Scale Interval (d)" name="actualInterval" type="number" placeholder="e.g. 0.01" />
                        <Field label="Number of Verification Intervals (n = Max/e)" name="numberOfIntervals" type="number" placeholder="e.g. 3000" />
                    </div>
                </div>
            </div>

            {/* INPUT MANUFACTURER INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Manufacturer Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Manufacturer Name" name="manufacturerName" placeholder="e.g. Mettler Toledo" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Address" name="manufacturerAddress" placeholder="Street, City, Postal Code" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Country" name="manufacturerCountry" placeholder="e.g. Switzerland" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Contact / Email" name="manufacturerContact" type="email" placeholder="contact@company.com" />
                    </div>
                </div>
            </div>

            {/* INPUT OPERATOR INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Operator Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Operator Name" name="operatorName" placeholder="Full name" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Certification / License No." name="operatorLicenseNumber" placeholder="e.g. CERT-2026-0456" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Test Date" name="testDate" type="date" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Signature / Initials" name="operatorSignature" placeholder="Type initials" />
                    </div>
                </div>
            </div>

            {/* INPUT LABORATORY INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Laboratory Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Laboratory Name" name="labName" placeholder="e.g. National Metrology Lab" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Accreditation No." name="labAccreditationNumber" placeholder="e.g. ISO/IEC 17025 - 00123" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Location" name="labLocation" placeholder="City, Country" />
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        <Field label="Ambient Conditions (Temp / Humidity)" name="labConditions" placeholder="e.g. 20°C / 50% RH" />
                    </div>
                </div>
            </div>

            <div className="flex gap-1 ml-auto mt-2">
                <button className="p-2 button border dark:border-main/5 border-main-dark/5">Save for Later</button>
                <button className="p-2 button border dark:border-main/5 border-main-dark/5">Create Test</button>
            </div>
        </div>
    </>
)