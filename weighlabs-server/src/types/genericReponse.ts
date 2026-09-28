export interface genericResponse {
    response: responseStatus,
    data: any
}

interface responseStatus {
    code: number
    ok: boolean
}