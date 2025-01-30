import { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface InputSearchProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
export function InputSearch({ className, ...props }: InputSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        {...props}
        className={`pl-8 ${className}`}
        placeholder={props.placeholder || 'Search ...'}
      />
    </div>
  );
}
