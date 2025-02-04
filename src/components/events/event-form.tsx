// src/components/events/event-form.tsx
import { ChangeEvent, FormEvent, useState } from 'react';
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
import ReactSelect from 'react-select';
import { useLocations } from '@/hooks/use-locations';
import { usePeople } from '@/hooks/use-query';
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events';
import type { Event, EventPerson, Person } from '@/lib/supabase';
import { useSections } from '@/hooks/use-sections';

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

export function EventForm({ initialData, onSuccess }: EventFormProps) {
  const router = useRouter();
  const { data: locations } = useLocations();
  const { data: sections } = useSections();
  const { data: allPeople, isLoading: isPeopleLoading } = usePeople();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [formData, setFormData] = useState({
    section_id: initialData?.section_id || undefined,
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

  const availableSpeakers =
    allPeople?.filter(person => person.role === 'speaker') || [];
  console.log('Filtered speakers before mapping:', availableSpeakers);

  const speakerOptions = availableSpeakers.map(speaker => ({
    label: speaker.name,
    value: speaker.id.toString(),
  }));
  console.log('Mapped speaker options:', speakerOptions);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const start_timestamp = `${formData.date}T${formData.start_time}:00Z`;
      const end_timestamp = `${formData.date}T${formData.end_time}:00Z`;

      const eventApiData = {
        section_id: formData.section_id ? Number(formData.section_id) : null,
        date: formData.date,
        title: formData.title,
        description: formData.description || null,
        start_time: start_timestamp, // Используем полный timestamp
        end_time: end_timestamp, // Используем полный timestamp
        location_id: formData.location_id ? Number(formData.location_id) : null,
        duration: formData.duration || null,
        speaker_ids: selectedSpeakerIds.map(id => Number(id)),
      };
      console.log('Creating event with data:', eventApiData);

      if (initialData) {
        await updateEvent.mutateAsync({
          id: initialData.id,
          updates: eventApiData,
        });
      } else {
        await createEvent.mutateAsync(eventApiData);
      }

      onSuccess?.();
      router.push('/events');
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      location_id: value ? Number(value) : undefined,
    }));
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
                onChange={(newValue: OptionType[]) => {
                  setSelectedSpeakerIds(
                    newValue.map((v: OptionType) => v.value)
                  );
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select speakers..."
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/events')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createEvent.isPending || updateEvent.isPending}
          >
            {initialData ? 'Update' : 'Create'} Event
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
