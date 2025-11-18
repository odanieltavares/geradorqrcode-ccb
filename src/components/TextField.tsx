
import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

const TextField: React.FC<TextFieldProps> = ({ label, id, error, description, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground/80 mb-1">{label}</label>
      <input
        id={id}
        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : 'border-input'}`}
        {...props}
      />
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
};

export default TextField;
