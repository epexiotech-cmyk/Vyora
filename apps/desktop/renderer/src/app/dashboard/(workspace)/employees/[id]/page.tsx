import ViewEmployeeClientPage from './client';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function ViewEmployeePage({ params }: { params: { id: string } }) {
  return <ViewEmployeeClientPage params={params} />;
}
