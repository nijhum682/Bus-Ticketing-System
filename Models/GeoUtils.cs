using System;
using System.Collections.Generic;

namespace BusTicketingBackend.Models
{
    public static class GeoUtils
    {
        private static readonly Dictionary<string, (double Lat, double Lon)> DistrictCoordinates = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Bagerhat", (22.6517, 89.7859) },
            { "Bandarban", (22.1953, 92.2184) },
            { "Barguna", (22.0953, 90.1121) },
            { "Barishal", (22.7010, 90.3535) },
            { "Bhola", (22.6859, 90.6482) },
            { "Bogura", (24.8465, 89.3778) },
            { "Brahmanbaria", (23.9575, 91.1158) },
            { "Chandpur", (23.2323, 90.6550) },
            { "Chapainawabganj", (24.5965, 88.2775) },
            { "Chattogram", (22.3569, 91.7832) },
            { "Chuadanga", (23.6402, 88.8418) },
            { "Cox's Bazar", (21.4272, 92.0058) },
            { "Cumilla", (23.4607, 91.1809) },
            { "Dhaka", (23.8103, 90.4125) },
            { "Dinajpur", (25.6279, 88.6332) },
            { "Faridpur", (23.5424, 89.6309) },
            { "Feni", (23.0159, 91.3976) },
            { "Gaibandha", (25.3297, 89.5430) },
            { "Gazipur", (24.0958, 90.4125) },
            { "Gopalganj", (23.0051, 89.8262) },
            { "Habiganj", (24.3749, 91.4110) },
            { "Jamalpur", (24.9376, 89.9377) },
            { "Jashore", (23.1633, 89.2182) },
            { "Jhalokathi", (22.6432, 90.1983) },
            { "Jhenaidah", (23.5450, 89.1725) },
            { "Joypurhat", (25.0947, 89.0945) },
            { "Khagrachhari", (23.1333, 91.9833) },
            { "Khulna", (22.8456, 89.5403) },
            { "Kishoreganj", (24.4260, 90.9821) },
            { "Kurigram", (25.8072, 89.6295) },
            { "Kushtia", (23.9038, 89.1226) },
            { "Lalmonirhat", (25.9923, 89.2847) },
            { "Laxmipur", (22.9463, 90.8286) },
            { "Madaripur", (23.2393, 90.1870) },
            { "Magura", (23.4873, 89.4187) },
            { "Manikganj", (23.8617, 90.0003) },
            { "Meherpur", (23.7712, 88.6366) },
            { "Moulvibazar", (24.4829, 91.7773) },
            { "Munshiganj", (23.4981, 90.4127) },
            { "Mymensingh", (24.7434, 90.3984) },
            { "Naogaon", (24.9132, 88.7531) },
            { "Narail", (23.1678, 89.5074) },
            { "Narayanganj", (23.6226, 90.4998) },
            { "Narsingdi", (24.1344, 90.7860) },
            { "Natore", (24.4102, 89.0076) },
            { "Netrokona", (24.8709, 90.7279) },
            { "Nilphamari", (25.8483, 88.9414) },
            { "Noakhali", (22.8222, 91.0970) },
            { "Pabna", (24.0113, 89.2562) },
            { "Panchagarh", (26.2709, 88.5952) },
            { "Patuakhali", (22.3593, 90.3299) },
            { "Pirojpur", (22.5786, 89.9824) },
            { "Rajbari", (23.7151, 89.5875) },
            { "Rajshahi", (24.3636, 88.6241) },
            { "Rangamati", (22.6556, 92.1754) },
            { "Rangpur", (25.7439, 89.2752) },
            { "Satkhira", (22.7185, 89.0705) },
            { "Shariatpur", (23.2423, 90.4348) },
            { "Sherpur", (25.0746, 90.1495) },
            { "Sirajganj", (24.3141, 89.5700) },
            { "Sunamganj", (25.0711, 91.4013) },
            { "Sylhet", (24.8949, 91.8687) },
            { "Tangail", (24.2450, 89.9113) },
            { "Thakurgaon", (26.0418, 88.4283) }
        };

        public static double GetDistance(string from, string to)
        {
            if (DistrictCoordinates.TryGetValue(from, out var c1) &&
                DistrictCoordinates.TryGetValue(to, out var c2))
            {
                const double R = 6371; // Radius of Earth in km
                var dLat = ToRadians(c2.Lat - c1.Lat);
                var dLon = ToRadians(c2.Lon - c1.Lon);
                var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                        Math.Cos(ToRadians(c1.Lat)) * Math.Cos(ToRadians(c2.Lat)) *
                        Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
                var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
                return R * c;
            }
            return 150.0; // Fallback distance
        }

        private static double ToRadians(double val)
        {
            return (Math.PI / 180) * val;
        }

        public static int CalculateFare(string from, string to, string busType)
        {
            var straightLineDistance = GetDistance(from, to);
            var roadDistance = straightLineDistance * 1.3; // estimated road distance modifier

            double ratePerKm;
            int minFare;

            if (busType.Equals("Non-AC", StringComparison.OrdinalIgnoreCase))
            {
                ratePerKm = 2.1;
                minFare = 50;
            }
            else if (busType.Equals("AC", StringComparison.OrdinalIgnoreCase))
            {
                ratePerKm = 3.8;
                minFare = 100;
            }
            else // Sleeper Class
            {
                ratePerKm = 5.5;
                minFare = 200;
            }

            var rawFare = roadDistance * ratePerKm;
            var fare = Math.Max(minFare, rawFare);

            // Round to nearest 10 for realistic ticketing pricing
            return (int)(Math.Round(fare / 10.0) * 10);
        }
    }
}
