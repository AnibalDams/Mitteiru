
export default function getCookie(name, document) {
    const allCookies = document.cookie.split(";")
    const cookies = {}
    allCookies.forEach(cookie => {
        const [name, value] = cookie.split("=")
        cookies[name.trim()]=value
    })
    return cookies[name]
} 