import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/manager"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const session = request.cookies.get("skylytics_session")?.value;
    const role = request.cookies.get("skylytics_role")?.value;
    const selectedAirport = request.cookies.get("skylytics_airport")?.value;

    const isProtected = protectedRoutes.some((r) => path.startsWith(r));
    const isAuthRoute = authRoutes.some((r) => path.startsWith(r));
    const isSelectAirport = path === "/manager/select-airport";

    // 1. Unauthenticated users
    if (isProtected && !session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", path);
        return NextResponse.redirect(loginUrl);
    }

    // 2. Role-based Guard for Manager Portal
    if (path.startsWith("/manager") && session && role !== "MANAGER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/passenger", request.url));
    }

    // 3. Manager must select an airport before accessing any manager page
    //    (admins bypass this — they see all airports)
    if (
        path.startsWith("/manager") &&
        !isSelectAirport &&
        session &&
        role === "MANAGER" &&
        !selectedAirport
    ) {
        return NextResponse.redirect(new URL("/manager/select-airport", request.url));
    }

    // 4. Logged-in users trying to access login/register
    if (isAuthRoute && session) {
        let dest = (role === "MANAGER" || role === "ADMIN") ? "/manager" : "/passenger";
        if (request.nextUrl.searchParams.has("redirect")) {
            dest = request.nextUrl.searchParams.get("redirect") || dest;
        }
        return NextResponse.redirect(new URL(dest, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
