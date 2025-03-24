// src/app/people/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { usePeople } from '@/hooks/use-people';
import { Person } from '@/types';
import { PersonForm } from '@/components/people/person-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InputSearch } from '@/components/ui/input-search';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { useToastContext } from '@/components/providers/toast-provider';
import { debounce } from 'lodash';
import Link from 'next/link';
import { ArrowLeft, Users, EyeOff, Eye } from 'lucide-react';
import Image from 'next/image';
import { ImportDialog } from '@/components/people/import-dialog';

export default function PeoplePage() {
  const { data: people, isLoading, deletePerson } = usePeople();
  const { showError, showSuccess } = useToastContext();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<
    Partial<Person> | undefined
  >();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const handleFormOpenChange = useCallback((open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedPerson(undefined);
    }
  }, []);

  const filteredPeople = people.filter(person => {
    // Role filter
    if (selectedRole && person.role !== selectedRole) {
      return false;
    }

    // Hidden filter
    if (!showHidden && person.hidden) {
      return false;
    }

    // All fields search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        person.name?.toLowerCase().includes(query) ||
        person.title?.toLowerCase().includes(query) ||
        person.company?.toLowerCase().includes(query) ||
        person.country?.toLowerCase().includes(query) ||
        person.email?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleSearch = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleDelete = async () => {
    if (personToDelete?.id) {
      try {
        await deletePerson.mutateAsync(personToDelete.id);
        setPersonToDelete(null);
        showSuccess('Person deleted successfully');
      } catch (error) {
        showError(error);
        console.error('Error deleting person:', error);
      }
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <CardTitle>People</CardTitle>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              Import from Excel
            </Button>
            <Button onClick={() => handleFormOpenChange(true)}>
              Add Person
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <InputSearch
              placeholder="Search by name, title, company, country..."
              onChange={e => handleSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="mb-4 flex gap-2">
            <Button
              variant={selectedRole === null ? 'default' : 'outline'}
              onClick={() => setSelectedRole(null)}
            >
              All
            </Button>
            <Button
              variant={selectedRole === 'speaker' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('speaker')}
            >
              Speakers
            </Button>
            <Button
              variant={selectedRole === 'attendee' ? 'default' : 'outline'}
              onClick={() => setSelectedRole('attendee')}
            >
              Attendees
            </Button>
            <Button
              variant={showHidden ? 'default' : 'outline'}
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center gap-2"
            >
              {showHidden ? (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Show Hidden</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Hide Hidden</span>
                </>
              )}
            </Button>
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            {filteredPeople.length}{' '}
            {filteredPeople.length === 1 ? 'person' : 'people'} found
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeople.map(person => (
                  <TableRow key={person.id}>
                    <TableCell>
                      {person.photo_url ? (
                        <Image
                          src={person.photo_url}
                          alt={person.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized // так как фото из Supabase
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.role}</TableCell>
                    <TableCell>{person.title || '-'}</TableCell>
                    <TableCell>{person.company || '-'}</TableCell>
                    <TableCell>{person.country || '-'}</TableCell>
                    <TableCell>{person.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPerson(person);
                            handleFormOpenChange(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setPersonToDelete(person)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PersonForm
        person={selectedPerson}
        open={isFormOpen}
        onOpenChangeAction={handleFormOpenChange}
      />

      <ConfirmDelete
        open={!!personToDelete}
        onOpenChange={() => setPersonToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Person"
        description={`Are you sure you want to delete "${personToDelete?.name}"? This action cannot be undone.`}
      />

      <ImportDialog open={isImportOpen} onOpenChangeAction={setIsImportOpen} />
    </div>
  );
}
