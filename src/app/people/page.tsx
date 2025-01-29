'use client';

import { useState } from 'react';
import { usePeople } from '@/hooks/use-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PeoplePage() {
  const { data: people, isLoading } = usePeople();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const filteredPeople = selectedRole
    ? people.filter(person => person.role === selectedRole)
    : people;

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>People</CardTitle>
          <Button>Add Person</Button>
        </CardHeader>
        <CardContent>
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
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
