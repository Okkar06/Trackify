import { Link } from "react-router-dom";

import Button from "@/components/Button";
import { Card, CardContent } from "@/components/Card";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-5">
          <div className="text-lg font-semibold text-trackify-text">Page not found</div>
          <div className="mt-2 text-sm text-trackify-muted">
            The page you’re looking for doesn’t exist.
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Link to="/">
              <Button>Go to Dashboard</Button>
            </Link>
            <Link to="/" className="text-sm text-trackify-muted hover:underline">
              Back
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

