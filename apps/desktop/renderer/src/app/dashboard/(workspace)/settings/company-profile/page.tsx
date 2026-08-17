import type { Metadata } from 'next';

import { CompanyProfileShell } from './_components/CompanyProfileShell';

export const metadata: Metadata = {
  title: 'Company GST Profile | Vyora',
};

export default function CompanyProfilePage() {
  return <CompanyProfileShell />;
}
