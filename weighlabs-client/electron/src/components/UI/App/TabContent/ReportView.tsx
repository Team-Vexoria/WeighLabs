import type { TestRecord } from '../../../../shared'
import { ReportViewTab } from './ReportViewTab'

export function reportView(record: TestRecord): React.ReactNode {
    return <ReportViewTab record={record} />
}