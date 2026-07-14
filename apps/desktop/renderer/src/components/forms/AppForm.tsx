import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm, FormProvider, UseFormReturn, SubmitHandler, FieldValues } from 'react-hook-form';
import { z } from 'zod';

interface AppFormProps<T extends FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod generic wrapper requires any for RHF compatibility
  schema: z.ZodType<any, any, any>;
  defaultValues?: Partial<T>;
  onSubmit: SubmitHandler<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  className?: string;
}

export function AppForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: AppFormProps<T>) {
  const methods = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RHF internal types require any cast for generic wrapper
    resolver: schema ? (zodResolver(schema) as any) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RHF internal types require any cast for generic wrapper
    defaultValues: defaultValues as any,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children(methods)}
      </form>
    </FormProvider>
  );
}
