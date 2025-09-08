import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Factory,
  Users,
  ClipboardCheck,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  Database,
  Bolt,
  Wrench,
  Gauge
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold tracking-tight">OEE Tracker</h1>
            </div>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-transform transform hover:scale-105">
                Access Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white relative overflow-hidden">
        {/* Background elements for an industrial feel */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="h-full w-full bg-[url('/grid-lines.svg')] bg-repeat bg-center"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Badge className="mb-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium uppercase tracking-wide">
            OEE Monitoring System
          </Badge>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Optimize Production.
            <br />
            <span className="text-blue-400">Maximize Efficiency.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            OEE Tracker is the essential tool for modern manufacturing. We provide real-time insights on your
            **Availability, Performance, and Quality** to eliminate downtime, boost output, and drive continuous improvement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-semibold rounded-md shadow-lg transition-transform transform hover:scale-105">
                Try OEE Tracker
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg font-semibold border-2 border-white text-black hover:bg-gray-300 transition-colors">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Features for a Smarter Factory
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Equip your team with the tools needed to monitor production efficiency and proactively solve problems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-shadow border-t-4 border-blue-600">
              <CardHeader>
                <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <ClipboardCheck className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold">Shift Data Logging</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Capture accurate, validated production data hourly, every shift, ensuring every record is reliable.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-t-4 border-green-600">
              <CardHeader>
                <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold">Approval Workflow</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Implement a robust approval process where supervisors can quickly verify and approve data entries.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-t-4 border-purple-600">
              <CardHeader>
                <div className="h-14 w-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold">Comprehensive OEE Dashboard</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Visualize key metrics in real-time, including Availability, Performance, and Quality, for actionable insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-t-4 border-orange-600">
              <CardHeader>
                <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-bold">Role-Based Access</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Securely manage permissions for different roles like Team Leaders, Supervisors, and Admins.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-t-4 border-red-600">
              <CardHeader>
                <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold">Real-Time Monitoring</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Stay on top of production status and pinpoint the exact moments of downtime as they happen.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-t-4 border-teal-600">
              <CardHeader>
                <div className="h-14 w-14 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Database className="h-8 w-8 text-teal-600" />
                </div>
                <CardTitle className="text-xl font-bold">Secure Data Storage</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Rely on encrypted cloud storage to protect your valuable production data with industry-leading security.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tailored Workflows for Every Role
            </h3>
            <p className="text-gray-600 text-lg">
              OEE Tracker provides a seamless experience for every member of your manufacturing team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center mr-6">
                  <Bolt className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">Team Leader</h4>
                  <p className="text-gray-600 mt-1">Focused on efficient data entry and tracking</p>
                </div>
              </div>
              <ul className="space-y-4 mb-6 text-lg">
                <li className="flex items-start text-gray-700">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Enter hourly production data with an intuitive, mobile-friendly interface.</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Track submission and approval status in real time.</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>View and edit past entries for accuracy and record-keeping.</span>
                </li>
              </ul>
              <Link href="/login">
                <Button variant="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors">
                  Login as Team Leader
                </Button>
              </Link>
            </Card>

            <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center mr-6">
                  <Gauge className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">Supervisor</h4>
                  <p className="text-gray-600 mt-1">Responsible for oversight and performance analysis</p>
                </div>
              </div>
              <ul className="space-y-4 mb-6 text-lg">
                <li className="flex items-start text-gray-700">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Approve or reject data entries with detailed notes and feedback.</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Access the full OEE dashboard to monitor performance across shifts and lines.</span>
                </li>
                <li className="flex items-start text-gray-700">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Generate reports and analyze historical production KPIs to identify trends.</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors">
                  Login as Supervisor
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Take Control of Your Production?
          </h3>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Join the leading factories that are using OEE Tracker to drive real, measurable improvements.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 text-lg font-bold rounded-full shadow-lg transition-transform transform hover:scale-105">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}