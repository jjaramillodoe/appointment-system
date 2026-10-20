import { notFound } from 'next/navigation';
import TestSecurityPage from './TestSecurityClient';

// Debug page: never expose outside local development
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <TestSecurityPage />;
}
