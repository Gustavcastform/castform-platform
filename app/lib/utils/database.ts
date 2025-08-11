import { getRequestContext } from '@cloudflare/next-on-pages';

function getKV() {
    try {
        const { env } = getRequestContext();
        return env.CASTFORM_KV;
    } catch (e) {
        if (e instanceof Error && e.message.includes('Could not find Cloudflare environment')) {
            throw new Error("Could not find Cloudflare environment. This is expected during build time.");
        }
        throw e;
    }
}


export function getDatabase() {
    try {
        const { env } = getRequestContext();
        return env.CASTFORM_DB;
    } catch (e) {
        if (e instanceof Error && e.message.includes('Could not find Cloudflare environment')) {
            throw new Error("Could not find Cloudflare environment. This is expected during build time.");
        }
        throw e;
    }
}