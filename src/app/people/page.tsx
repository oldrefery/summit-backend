// src/app/people/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { usePeople } from '@/hooks/use-query';
import { Person } from '@/lib/supabase';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InputSearch } from '@/components/ui/input-search';
import { debounce } from 'lodash';

export default function PeoplePage() {
  const { data: people, isLoading, deletePerson } = usePeople();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<
    Partial<Person> | undefined
  >();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        setDeleteDialogOpen(false);
        setPersonToDelete(null);
      } catch (error) {
        console.error('Error deleting person:', error);
      }
    }
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>People</CardTitle>
          <Button onClick={() => handleFormOpenChange(true)}>Add Person</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <InputSearch
              placeholder="Search by name, title, company..."
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
                          onClick={() => {
                            setPersonToDelete(person);
                            setDeleteDialogOpen(true);
                          }}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white text-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-medium">{personToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
