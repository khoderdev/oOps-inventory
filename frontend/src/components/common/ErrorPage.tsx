import { AlertTriangle, Home } from "lucide-react";
import { Link, useRouteError } from "react-router-dom";
import Button from "../ui/Button";

const ErrorPage = () => {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">Sorry, an unexpected error has occurred.</p>
          {error?.message && (
            <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
              <i>{error.message}</i>
            </p>
          )}
        </div>

        <Link to="/">
          <Button leftIcon={<Home className="w-4 h-4" />}>Go Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
