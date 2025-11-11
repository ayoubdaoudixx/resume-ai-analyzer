import Navbar from '../components/Navbar'; // Don't forget this import!
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumer" },
        { name: "description", content: "Your powerful tool to get that Job" },
    ];
}

export default function Home() {
    return <main className="bg-[url('images/bg-main.svg')] bg-cover">

        <Navbar />
        <section className="main-section">
            <div className="page-heading">
                <h1>Track Your Applications and Resume</h1>
                <h2>Review Your Submissions and check AI-Powered feedback.</h2>
            </div>
        </section>
    </main>
}