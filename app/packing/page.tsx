'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PackingPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/accounting'); }, [router]);
  return null;
}
