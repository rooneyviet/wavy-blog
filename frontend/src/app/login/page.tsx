import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

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
            <LoginForm />
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
