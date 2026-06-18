export default function ProfilePage({ params }: { params: { username: string } }) {
  return <div>Profile: {params.username}</div>;
}
