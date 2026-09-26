import { Suspense } from 'react';
import { Lesson } from '@/components/lesson';
export default function LessonPage() { return <Suspense fallback={<p>Preparando sua aula…</p>}><Lesson/></Suspense>; }
