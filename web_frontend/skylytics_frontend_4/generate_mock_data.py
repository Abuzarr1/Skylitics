import csv
import random
from datetime import datetime, timedelta

def generate_massive_mock_data(filename, num_rows=100000):
    airports = ['ATL', 'SEA', 'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'LAS', 'CLT']
    carriers = ['DL', 'AA', 'UA', 'WN', 'AS', 'B6']
    
    start_date = datetime(2026, 1, 1)
    
    headers = [
        'Date', 'Carrier', 'FlightNumber', 'Origin', 'Destination', 
        'ScheduledDeparture', 'DepartureTime', 'DepartureDelay', 
        'TaxiOut', 'WheelsOff', 'ScheduledArrival', 'ArrivalTime', 
        'ArrivalDelay', 'AirTime', 'Distance', 
        'CarrierDelay', 'WeatherDelay', 'NASDelay', 'SecurityDelay', 'LateAircraftDelay'
    ]
    
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for i in range(num_rows):
            date = (start_date + timedelta(days=random.randint(0, 120))).strftime('%Y-%m-%d')
            carrier = random.choice(carriers)
            flight_num = f"{carrier}{random.randint(100, 9999)}"
            origin = random.choice(airports)
            dest = random.choice([a for a in airports if a != origin])
            
            sched_dep_hour = random.randint(0, 23)
            sched_dep_min = random.randint(0, 59)
            sched_dep_str = f"{sched_dep_hour:02d}{sched_dep_min:02d}"
            
            dep_delay = 0
            if random.random() < 0.25: # 25% chance of delay
                dep_delay = random.randint(5, 180)
            
            dep_time_obj = datetime.strptime(sched_dep_str, '%H%M') + timedelta(minutes=dep_delay)
            dep_time_str = dep_time_obj.strftime('%H%M')
            
            taxi_out = random.randint(10, 30)
            wheels_off_obj = dep_time_obj + timedelta(minutes=taxi_out)
            wheels_off_str = wheels_off_obj.strftime('%H%M')
            
            air_time = random.randint(60, 360)
            dist = air_time * 8 # rough estimate
            
            sched_arr_obj = datetime.strptime(sched_dep_str, '%H%M') + timedelta(minutes=air_time + 40)
            sched_arr_str = sched_arr_obj.strftime('%H%M')
            
            arr_time_obj = wheels_off_obj + timedelta(minutes=air_time + random.randint(-10, 20))
            arr_time_str = arr_time_obj.strftime('%H%M')
            
            arr_delay = (arr_time_obj - sched_arr_obj).total_seconds() / 60
            
            # Delay breakdown
            c_delay = w_delay = n_delay = s_delay = l_delay = 0
            if arr_delay > 15:
                total = arr_delay
                c_delay = random.randint(0, int(total))
                total -= c_delay
                if total > 0:
                    w_delay = random.randint(0, int(total))
                    total -= w_delay
                if total > 0:
                    n_delay = int(total)
            
            writer.writerow([
                date, carrier, flight_num, origin, dest,
                sched_dep_str, dep_time_str, dep_delay,
                taxi_out, wheels_off_str, sched_arr_str, arr_time_str,
                arr_delay, air_time, dist,
                c_delay, w_delay, n_delay, s_delay, l_delay
            ])
            
            if i % 10000 == 0:
                print(f"Generated {i} rows...")

    print(f"Successfully generated {num_rows} rows in {filename}")

if __name__ == "__main__":
    generate_massive_mock_data('/Users/macbookpro/Desktop/fyp_antigravity/web_frontend/skylytics_frontend_4/public/data/CSVs/flights.csv', 100000)
