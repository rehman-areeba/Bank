import { Navbar } from './Navbar';

interface PageWrapperProps {
  title?: string;
  backTo?: string;
  backLabel?: string;
  children: React.ReactNode;
}

export const PageWrapper = ({ title, backTo, backLabel, children }: PageWrapperProps) => {
  return (
    <div className="page-bg" style={{ overflowX: 'hidden', width: '100%' }}>
      <Navbar title={title} backTo={backTo} backLabel={backLabel} />
      <div className="dashboard-container">{children}</div>
    </div>
  );
};
