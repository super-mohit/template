// File: frontend/src/app/data-center/page.tsx
'use client'
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUpload } from '@/components/ingestion/FileUpload'; 
import { JobProgress } from '@/components/ingestion/JobProgress';
import { type Job } from '@/lib/api-client';

export default function DataCenterPage() {
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Ingestion Center</CardTitle>
          <CardDescription>
            Upload unstructured documents (PDFs, emails) or structured data (CSV, JSON)
            to be processed by the AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onUploadSuccess={setActiveJob} />
          {activeJob && <JobProgress job={activeJob} />}
        </CardContent>
      </Card>
    </div>
  );
}
