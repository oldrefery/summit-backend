// src/components/people/import-dialog.tsx
'use client';

import { ChangeEvent, useState } from 'react';
import readXlsxFile from 'read-excel-file';
import { usePeople } from '@/hooks/use-people';
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
import { IMPORT_DIALOG } from '@/app/constants';

interface ImportDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChangeAction }: ImportDialogProps) {
  const { createPerson, data: existingPeople } = usePeople();
  const { showError, showSuccess } = useToastContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const validateRole = (role: string): PersonRole => {
    return role.toLowerCase() === 'speaker' ? 'speaker' : IMPORT_DIALOG.DEFAULT_ROLE;
  };

  // Convert name to lowercase and remove extra spaces
  const normalizeName = (name: string) => name.trim().toLowerCase();

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMPORT_DIALOG.MAX_FILE_SIZE) {
      showError('File size exceeds 5MB limit');
      return;
    }

    setIsProcessing(true);

    try {
      const rows = await readXlsxFile(file);

      if (rows.length < 2) {
        showError('Excel file must contain at least one data row');
        return;
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      if (!IMPORT_DIALOG.EXPECTED_HEADERS.every((header: string) => headers.includes(header))) {
        showError('Invalid Excel file structure. Please check column headers');
        return;
      }

      // Create a set of existing names for duplicate checking
      const existingNames = new Set(
        existingPeople.map(p => normalizeName(p.name))
      );

      let duplicatesCount = 0;
      const uniquePeople: PersonFormData[] = [];

      const people: PersonFormData[] = dataRows.map(row => {
        const [name, role, title, company, country, email, mobile, bio] =
          row as (string | null)[];

        return {
          name: name?.toString() || '',
          role: validateRole(role?.toString() || IMPORT_DIALOG.DEFAULT_ROLE),
          title: title?.toString() || null,
          company: company?.toString() || null,
          country: country?.toString() || null,
          email: email?.toString() || null,
          mobile: mobile?.toString() || null,
          bio: bio?.toString() || null,
          photo_url: null,
        };
      });

      // Skip records that already exist in the database
      for (const person of people) {
        const normalized = normalizeName(person.name);

        if (existingNames.has(normalized)) {
          duplicatesCount++;
          continue;
        }

        uniquePeople.push(person);
        existingNames.add(normalized);
      }

      // Check for required fields
      const errors = uniquePeople
        .map((person, index) => {
          if (!person.name.trim()) {
            return `Row ${index + 2}: Name is required`;
          }
          return null;
        })
        .filter((error): error is string => error !== null);

      if (errors.length > 0) {
        showError(`Validation errors:\n${errors.join('\n')}`);
        return;
      }

      // Save valid records to the database
      for (const person of uniquePeople) {
        await createPerson.mutateAsync(person);
      }

      // Prepare result message
      let message = `Successfully imported ${uniquePeople.length} people`;
      if (duplicatesCount > 0) {
        message += `. ${duplicatesCount} duplicates skipped`;
      }
      if (duplicatesCount === dataRows.length) {
        showError('All records are duplicates. Nothing to import');
        return;
      }

      showSuccess(message);
      onOpenChangeAction(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unknown error');
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
