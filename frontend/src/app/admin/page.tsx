import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0">
      <CardHeader>
        <CardTitle>Welcome to the Admin Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Select an option from the sidebar to get started.
        </p>
      </CardContent>
    </Card>
  );
}
