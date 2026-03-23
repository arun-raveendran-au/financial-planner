export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Financial Planner</h1>
          <p className="text-gray-500 mt-1">Your end-to-end financial planning suite</p>
        </div>
        {children}
      </div>
    </div>
  );
}
