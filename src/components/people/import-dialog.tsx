// src/components/people/import-dialog.tsx
'use client';

import { ChangeEvent, useState } from 'react';
import { read, utils } from 'xlsx';
import { usePeople } from '@/hooks/use-query';
import { PersonFormData, PersonRole } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToastContext } from '@/components/providers/toast-provider';

interface ImportDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

interface ExcelRow {
  Name?: string;
  name?: string;
  Role?: string;
  role?: string;
  Title?: string;
  title?: string;
  Company?: string;
  company?: string;
  Country?: string;
  country?: string;
  Email?: string;
  email?: string;
  Mobile?: string;
  mobile?: string;
  Bio?: string;
  bio?: string;
}

export function ImportDialog({ open, onOpenChangeAction }: ImportDialogProps) {
  const { createPerson } = usePeople();
  const { showError, showSuccess } = useToastContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<ExcelRow>(worksheet);
      console.log(JSON.stringify(jsonData, null, 2));

      const validateRole = (role: string): PersonRole => {
        const normalizedRole = role.toLowerCase();
        return normalizedRole === 'speaker' ? 'speaker' : 'attendee';
      };

      // Map columns from Excel to PersonFormData fields
      const people: PersonFormData[] = jsonData.map(row => ({
        name: row.Name || row.name || '',
        role: validateRole(row.Role || row.role || 'attendee'),
        title: row.Title || row.title || null,
        company: row.Company || row.company || null,
        country: row.Country || row.country || null,
        email: row.Email || row.email || null,
        mobile: row.Mobile || row.mobile || null,
        bio: row.Bio || row.bio || null,
        photo_url: null,
      }));

      // Validate data
      const errors = people
        .map((person, index) => {
          if (!person.name) {
            return `Row ${index + 2}: Name is required`;
          }

          // Add if email validation is required
          // if (
          //   person.email &&
          //   !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)
          // ) {
          //   return `Row ${index + 2}: Invalid email format`;
          // }

          return null;
        })
        .filter((error): error is string => error !== null);

      if (errors.length > 0) {
        showError(`Validation errors:\n${errors.join('\n')}`);
        return;
      }

      // Create records
      for (const person of people) {
        await createPerson.mutateAsync(person);
      }

      showSuccess(`Successfully imported ${people.length} people`);
      onOpenChangeAction(false);
    } catch (error) {
      showError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import People from Excel</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Excel file should have columns: Name*, Role, Title, Company,
            Country, Email, Mobile, Bio (* required)
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChangeAction(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
