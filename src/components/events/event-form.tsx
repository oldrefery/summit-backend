// src/components/events/event-form.tsx
'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactSelect, { MultiValue } from 'react-select';
import { useLocations } from '@/hooks/use-locations';
import { usePeople } from '@/hooks/use-query';
import type { Event, EventFormData, EventPerson, Person } from '@/types';
import { useSections } from '@/hooks/use-sections';
import { useToastContext } from '@/components/providers/toast-provider';
import { useEvents } from '@/hooks/use-events';

interface EventFormProps {
  initialData?: Event & {
    event_people?: (EventPerson & {
      person: Person;
    })[];
  };
  onSuccess?: () => void;
}

interface OptionType {
  label: string;
  value: string;
}

interface FormData {
  section_id: number;
  date: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location_id: number | undefined;
  duration: string;
}

export function EventForm({ initialData, onSuccess }: EventFormProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToastContext();
  const { data: locations } = useLocations();
  const { data: sections } = useSections();
  const { data: allPeople, isLoading: isPeopleLoading } = usePeople();
  const { createEvent, updateEvent } = useEvents();
  const [isDirty, setIsDirty] = useState(false); // for tracking form changes

  const [formData, setFormData] = useState<FormData>({
    section_id: initialData?.section_id || sections?.[0]?.id || 0, // Default to first section or 0
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_time: initialData?.start_time
      ? format(new Date(initialData.start_time), 'HH:mm')
      : '09:00',
    end_time: initialData?.end_time
      ? format(new Date(initialData.end_time), 'HH:mm')
      : '10:00',
    location_id: initialData?.location_id || undefined,
    duration: initialData?.duration || '',
  });

  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>(
    initialData?.event_people
      ?.filter(ep => ep.person?.role === 'speaker')
      .map(ep => ep.person?.id?.toString())
      .filter((id): id is string => id !== undefined) || []
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();

        return 'Changes you made may not be saved.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const availableSpeakers =
    allPeople?.filter(person => person.role === 'speaker') || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const start_timestamp = `${formData.date}T${formData.start_time}:00Z`;
      const end_timestamp = `${formData.date}T${formData.end_time}:00Z`;

      const eventApiData: EventFormData = {
        section_id: formData.section_id,
        date: formData.date,
        title: formData.title,
        description: formData.description || null,
        start_time: start_timestamp,
        end_time: end_timestamp,
        location_id: formData.location_id ? Number(formData.location_id) : null,
        duration: formData.duration || null,
        speaker_ids: selectedSpeakerIds.map(id => Number(id)),
      };

      if (initialData) {
        await updateEvent.mutateAsync({
          id: initialData.id,
          updates: eventApiData,
        });
        showSuccess('Event updated successfully');
      } else {
        await createEvent.mutateAsync(eventApiData);
        showSuccess('Event created successfully');
      }

      setIsDirty(false);
      onSuccess?.();
      router.push('/events');
    } catch (error) {
      showError(error);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      location_id: value ? Number(value) : undefined,
    }));
  };

  const handleCancel = () => {
    if (isDirty) {
      if (
        window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
      ) {
        router.push('/events');
      }
    } else {
      router.push('/events');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    const eventDate = new Date(formData.date);
    const startTime = new Date(`${formData.date}T${formData.start_time}`);
    const endTime = new Date(`${formData.date}T${formData.end_time}`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (eventDate < now) {
      errors.date = 'Event date cannot be in the past';
    }

    if (endTime <= startTime) {
      errors.end_time = 'End time must be after start time';
    }
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => showError(error));
      return false;
    }

    return true;
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? 'Edit Event' : 'Create New Event'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.section_id?.toString()}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, section_id: Number(value) }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections?.map(section => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location_id?.toString()}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No location</SelectItem>
                {locations?.map(location => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Speakers</Label>
            {isPeopleLoading ? (
              <div>Loading speakers...</div>
            ) : (
              <ReactSelect
                isMulti
                options={availableSpeakers.map(speaker => ({
                  label: speaker.name,
                  value: speaker.id.toString(),
                }))}
                value={selectedSpeakerIds.map(id => ({
                  label:
                    availableSpeakers.find(s => s.id.toString() === id)?.name ||
                    '',
                  value: id,
                }))}
                onChange={(newValue: MultiValue<OptionType>) => {
                  const values = Array.isArray(newValue) ? newValue : [];
                  setSelectedSpeakerIds(values.map(v => v.value));
                  setIsDirty(true);
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select speakers..."
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createEvent.isPending || updateEvent.isPending}
          >
            {createEvent.isPending || updateEvent.isPending ? (
              <span>Saving...</span>
            ) : initialData ? (
              'Update'
            ) : (
              'Create'
            )}{' '}
            Event{' '}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
