import { join as joinPosixPath } from 'node:path/posix';
export function joinUrl(...parts) {
    if (!Array.isArray(parts)) {
        throw new TypeError(`Expected string arguments`);
    }
    if (parts.length === 0) {
        throw new Error(`Expected at least one url part`);
    }
    const fullUrl = new URL(parts[0]);
    fullUrl.pathname = joinPosixPath(fullUrl.pathname, ...parts.slice(1));
    return fullUrl.toString();
}
export function extractWildcardParam(request) {
    return request.url.replace(request.routeOptions.url.replace('*', ''), '');
}
//# sourceMappingURL=utils.js.map