import { NextResponse, type NextRequest } from "next/server";

const privateRoutes = ["/dashboard", "/tasks", "/users", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivateRoute = privateRoutes.some((route) => pathname.startsWith(route));
  const session = request.cookies.get("tigilabs_session");

  if (isPrivateRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tasks/:path*", "/users/:path*", "/settings/:path*"]
};
