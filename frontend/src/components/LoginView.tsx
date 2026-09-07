import { useState } from "react";
import { login, register } from "../lib/api";
import { User, Lock, Loader2 } from "lucide-react";

export default function LoginView({ onAuthSuccess }: { onAuthSuccess: (token: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await login(username, password);
        onAuthSuccess(data.access_token);
      } else {
        await register(username, password);
        // Auto-login after successful registration
        const data = await login(username, password);
        onAuthSuccess(data.access_token);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-seerah-bg p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-seerah-border p-8">
        <h2 className="text-2xl font-serif font-bold text-seerah-text mb-6 text-center">
          {isLogin ? "Welcome to Seerah Tutor" : "Create Private Account"}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-seerah-muted mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-seerah-border rounded-lg focus:ring-2 focus:ring-seerah-accent outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-seerah-muted mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-seerah-border rounded-lg focus:ring-2 focus:ring-seerah-accent outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-seerah-accent text-white py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-seerah-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-seerah-accent font-medium hover:underline"
          >
            {isLogin ? "Register here" : "Sign in here"}
          </button>
        </p>
      </div>
    </div>
  );
}