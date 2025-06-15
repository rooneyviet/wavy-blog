import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 flex items-center justify-center">
        <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full max-w-md border-0">
          <CardHeader className="text-center p-0 ">
            <div className="flex justify-center">
              <span className="material-icons text-pink-500 text-6xl">
                waves
              </span>
            </div>
            <CardTitle className="text-3xl font-semibold text-gray-800 mt-0">
              Login
            </CardTitle>
            <CardDescription className="text-gray-500 pt-2">
              Login to continue to Wavy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-0">
            <form className="space-y-6">
              <div>
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </Label>
                <div className="relative flex items-center">
                  <span className="material-icons absolute left-0 pl-3 text-gray-400 pointer-events-none">
                    email
                  </span>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-3 h-auto placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </Label>
                <div className="relative flex items-center">
                  {" "}
                  <span className="material-icons absolute left-0 pl-3 text-gray-400 pointer-events-none">
                    {" "}
                    lock
                  </span>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-3 h-auto placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox
                    id="remember-me"
                    name="remember-me"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </Label>
                </div>
                <div className="text-sm">
                  <Link
                    href="#"
                    className="font-medium text-pink-600 hover:text-pink-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto"
                >
                  Log In
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className=" text-center text-sm text-gray-500 flex-col p-0">
            <p>
              Don't have an account?{" "}
              <Link
                href="#"
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </>
  );
}
