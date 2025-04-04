// src/components/events/event-form.tsx
'use client';

import { ChangeEvent, FormEvent, useEffect, useState, useRef } from 'react';
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
import { useSections } from '@/hooks/use-sections';
import { usePeople } from '@/hooks/use-people';
import { useEvents } from '@/hooks/use-events';
import type { EventFormData } from '@/types';
import type { EventWithRelations } from '@/hooks/use-events';
import { useToastContext } from '@/components/providers/toast-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { extractTimeForForm, createUTCTimeString, calculateDuration } from '@/utils/date-utils';

interface EventFormProps {
  initialData?: EventWithRelations;
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
  const [isDirty, setIsDirty] = useState(false);
  const [initialFormState, setInitialFormState] = useState<string>('');

  const [formData, setFormData] = useState<FormData>(() => {
    const formattedStartTime = initialData?.start_time
      ? extractTimeForForm(initialData.start_time)
      : '09:00';
    const formattedEndTime = initialData?.end_time
      ? extractTimeForForm(initialData.end_time)
      : '10:00';

    return {
      section_id: initialData?.section_id || 0,
      date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
      title: initialData?.title || '',
      description: initialData?.description || '',
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      location_id: initialData?.location_id || undefined,
      duration: initialData?.duration || '',
    };
  });

  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>(
    initialData?.event_people
      ?.filter(ep => ep.person?.role === 'speaker')
      .map(ep => ep.person?.id?.toString())
      .filter((id): id is string => id !== undefined) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Save initial form state for comparison - using a ref to avoid dependency issues
  const initialFormDataRef = useRef(formData);
  const initialSpeakerIdsRef = useRef(selectedSpeakerIds);

  useEffect(() => {
    const initialState = {
      ...initialFormDataRef.current,
      speaker_ids: initialSpeakerIdsRef.current
    };
    setInitialFormState(JSON.stringify(initialState));
  }, []);

  useEffect(() => {
    if (sections?.length && formData.section_id === 0) {
      const firstSection = sections[0];
      setFormData(prev => ({
        ...prev,
        section_id: firstSection.id,
        date: firstSection.date || prev.date
      }));
    }
  }, [sections, formData.section_id]);

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

  useEffect(() => {
    if (formData.date && formData.start_time && formData.end_time) {
      const startTimeUTC = createUTCTimeString(formData.date, formData.start_time);
      const endTimeUTC = createUTCTimeString(formData.date, formData.end_time);
      const calculatedDuration = calculateDuration(startTimeUTC, endTimeUTC);

      setFormData(prev => ({
        ...prev,
        duration: calculatedDuration
      }));
    }
  }, [formData.date, formData.start_time, formData.end_time]);

  const availableSpeakers =
    allPeople?.filter(person => person.role === 'speaker') || [];

  if (!sections?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Create UTC time strings
      const startTimeUTC = createUTCTimeString(formData.date, formData.start_time);
      const endTimeUTC = createUTCTimeString(formData.date, formData.end_time);
      const calculatedDuration = calculateDuration(startTimeUTC, endTimeUTC);

      const eventApiData: EventFormData = {
        section_id: Number(formData.section_id),
        date: formData.date,
        title: formData.title,
        description: formData.description || null,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        location_id: formData.location_id ? Number(formData.location_id) : null,
        duration: calculatedDuration,
        speaker_ids: selectedSpeakerIds.map(id => Number(id))
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

      router.push('/events');
      onSuccess?.();
    } catch (error) {
      showError(error);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'start_time' && formData.end_time) {
      // Calculate current duration in minutes
      const [startHours, startMinutes] = formData.start_time.split(':').map(Number);
      const [endHours, endMinutes] = formData.end_time.split(':').map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;

      // Calculate new end time based on new start time and current duration
      const [newStartHours, newStartMinutes] = value.split(':').map(Number);
      const newStartTotalMinutes = newStartHours * 60 + newStartMinutes;
      const newEndTotalMinutes = newStartTotalMinutes + durationMinutes;

      const newEndHours = Math.floor(newEndTotalMinutes / 60);
      const newEndMinutes = newEndTotalMinutes % 60;

      // Format the new end time
      const formattedEndHours = newEndHours.toString().padStart(2, '0');
      const formattedEndMinutes = newEndMinutes.toString().padStart(2, '0');
      const newEndTime = `${formattedEndHours}:${formattedEndMinutes}`;

      // Update both start_time and end_time
      setFormData(prev => ({
        ...prev,
        [name]: value,
        end_time: newEndTime
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      location_id: value ? Number(value) : undefined,
    }));
  };

  const handleSectionChange = (value: string) => {
    const selectedSection = sections.find(s => s.id === Number(value));
    setFormData(prev => ({
      ...prev,
      section_id: Number(value),
      date: selectedSection?.date || prev.date
    }));
  };

  const handleCancel = () => {
    const currentFormState = JSON.stringify({
      ...formData,
      speaker_ids: selectedSpeakerIds
    });

    // Only show confirmation if there are actual changes
    const hasChanges = currentFormState !== initialFormState;

    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/events');
      }
    } else {
      router.push('/events');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    const eventDate = new Date(formData.date);
    const startTime = new Date(`${formData.date}T${formData.start_time}`);
    const endTime = new Date(`${formData.date}T${formData.end_time}`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (eventDate < now) {
      newErrors.date = 'Event date cannot be in the past';
    }

    if (endTime <= startTime) {
      newErrors.end_time = 'End time must be after start time';
      showError('End time must be after start time');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return false;
    }

    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Event' : 'Create New Event'}
        </CardTitle>
      </CardHeader>
      <form role="form" onSubmit={handleSubmit}>
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
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.title}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.section_id.toString()}
                onValueChange={handleSectionChange}
                required
              >
                <SelectTrigger aria-label="Section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem
                      key={section.id}
                      value={section.id.toString()}
                      data-testid={`section-option-${section.id}`}
                    >
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                aria-invalid={!!errors.date}
                aria-errormessage={errors.date}
              />
              {errors.date && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.date}
                </p>
              )}
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
                aria-invalid={!!errors.end_time}
                aria-errormessage={errors.end_time}
              />
              {errors.end_time && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.end_time}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <p className="text-sm text-muted-foreground h-10 flex items-center">{formData.duration}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location_id?.toString()}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger aria-label="Location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map(location => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="speakers">Speakers</Label>
            <ReactSelect
              inputId="speakers"
              aria-label="Speakers"
              isMulti
              isLoading={isPeopleLoading}
              options={availableSpeakers.map(speaker => ({
                value: speaker.id.toString(),
                label: speaker.name,
              }))}
              value={selectedSpeakerIds.map(id => {
                const speaker = availableSpeakers.find(s => s.id.toString() === id);
                return speaker
                  ? { value: id, label: speaker.name }
                  : null;
              }).filter((v): v is OptionType => v !== null)}
              onChange={(newValue: MultiValue<OptionType>) => {
                setSelectedSpeakerIds(newValue.map(v => v.value));
                setIsDirty(true);
              }}
              classNames={{
                control: () => 'flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-1',
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Event' : 'Create Event'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
