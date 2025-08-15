export const isProd = process.env.NODE_ENV === 'production'
export const appUrl = isProd ? 'https://sudo.party' : 'http://localhost:3000'