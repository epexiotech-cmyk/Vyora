import EditEmployeeClientPage from './client';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  return <EditEmployeeClientPage params={params} />;
}
