import { redirect } from 'next/navigation';

// Redirect signup to signin since magic links handle both
export default function SignUpPage() {
  redirect('/signin');
}
