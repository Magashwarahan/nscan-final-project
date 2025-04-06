
// Import directly from the AuthProvider component
import { useAuth as useAuthOriginal } from '@/components/auth/AuthProvider';

// Re-export the hook to maintain compatibility
export const useAuth = useAuthOriginal;
