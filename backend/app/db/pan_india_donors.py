import json
import os
import re
import datetime
from pathlib import Path

# Blood group distribution for the 20 donors per state
BLOOD_GROUP_DISTRIBUTION = [
    "O+", "O+", "O+", "O+",
    "A+", "A+", "A+",
    "B+", "B+", "B+", "B+",
    "AB+", "AB+",
    "O-", "O-",
    "A-", "A-",
    "B-", "B-",
    "AB-"
]

LOCALITY_PREFIXES = [
    "Civil Lines", "MG Road Area", "Gandhi Nagar", "Model Town", "Station Road",
    "University Campus", "City Center", "Lake View", "North Extension", "South Zone",
    "Tech Park Road", "Hospital Road", "Old Town", "New Colony", "Ring Road",
    "Market Square", "Green Park", "Industrial Area", "Subhash Nagar", "Nehru Nagar"
]

# Authentic regional names for all 36 Indian States and Union Territories
STATE_NAMES_MAP = {
    "Andhra Pradesh": [
        "Ravi Teja Reddy", "Suresh Babu Chowdary", "Kalyan Varma", "Sai Pradeep Naidu", "Venkata Ramana Rao",
        "Lakshmi Narayana Goud", "Srinivas Raju", "Anusha Chowdary", "Divya Vani Reddy", "Swapna Madhavi",
        "Harika Varma", "Ramakrishna Prasad", "Chandra Shekar Naidu", "Naveen Kumar Goud", "Sandeep Varma",
        "Sneha Latha Reddy", "Bhavani Shankar", "Madhavi Latha", "Pradeep Kumar Rao", "Kiranmai Naidu"
    ],
    "Arunachal Pradesh": [
        "Tenzing Tayeng", "Wangchu Riba", "Dorjee Pertin", "Kago Gao", "Tashi Ete",
        "Kojin Lego", "Bem Dai", "Yapi Borang", "Nabam Dabi", "Toko Basar",
        "Taba Tayeng", "Hage Riba", "Likha Pertin", "Tage Gao", "Dusu Ete",
        "Nani Lego", "Bamin Dai", "Tasso Borang", "Gyati Dabi", "Kime Basar"
    ],
    "Assam": [
        "Bhaskar Jyoti Kalita", "Himanta Saikia", "Pranjal Borah", "Anupam Barman", "Utpal Deka",
        "Jatin Goswami", "Mridul Das", "Deep Jyoti Sarmah", "Manash Dutta", "Partha Baruah",
        "Gitashree Kalita", "Barnali Saikia", "Jonali Borah", "Rupali Barman", "Pallavi Deka",
        "Rimpi Goswami", "Moushumi Das", "Dimple Sarmah", "Kakoli Dutta", "Nabaneeta Baruah"
    ],
    "Bihar": [
        "Alok Kumar Singh", "Rajesh Jha", "Vikash Yadav", "Ritesh Sharma", "Manish Tiwari",
        "Chandan Pandey", "Santosh Verma", "Saurabh Mishra", "Rakesh Paswan", "Niraj Kumar",
        "Shweta Singh", "Khushboo Jha", "Annu Yadav", "Rinki Sharma", "Soni Tiwari",
        "Pooja Pandey", "Anjali Verma", "Priyanka Mishra", "Nisha Paswan", "Archana Kumari"
    ],
    "Chhattisgarh": [
        "Hemant Sahu", "Bhupesh Dewangan", "Toman Verma", "Tikam Patel", "Lokesh Netam",
        "Yogesh Markam", "Dhananjay Baghel", "Omprakash Chandrakar", "Yashwant Sinha", "Khemlal Kurre",
        "Kaushalya Sahu", "Dileshwari Dewangan", "Yamini Verma", "Pratima Patel", "Hemlata Netam",
        "Champa Markam", "Rekha Baghel", "Poonam Chandrakar", "Bharti Sinha", "Sarita Kurre"
    ],
    "Goa": [
        "Savio Fernandes", "Nigel D'Souza", "Rohan Pereira", "Sheldon Rodrigues", "Royce Silva",
        "Aliston Costa", "Keith Naik", "Aaron Kamat", "Jason Prabhu", "Ryan Gaunkar",
        "Maria Fernandes", "Natasha D'Souza", "Fiona Pereira", "Larissa Rodrigues", "Sneha Silva",
        "Pearl Costa", "Sanjana Naik", "Kimberly Kamat", "Althea Prabhu", "Nicole Gaunkar"
    ],
    "Gujarat": [
        "Chirag Patel", "Bhavesh Shah", "Hitesh Desai", "Jignesh Mehta", "Mehul Joshi",
        "Hardik Trivedi", "Parth Bhatt", "Ketan Vora", "Tushar Solanki", "Pratik Prajapati",
        "Hetal Patel", "Kinjal Shah", "Jagruti Desai", "Mittal Mehta", "Payal Joshi",
        "Dharti Trivedi", "Urvashi Bhatt", "Falguni Vora", "Neha Solanki", "Vaishali Prajapati"
    ],
    "Haryana": [
        "Virender Malik", "Kuldeep Dahiya", "Joginder Hooda", "Sandeep Dalal", "Manjeet Phogat",
        "Devender Sangwan", "Ravinder Boora", "Surender Ahlawat", "Amit Sheoran", "Vikas Rathi",
        "Ritu Malik", "Sunita Dahiya", "Kavita Hooda", "Suman Dalal", "Meenakshi Phogat",
        "Poonam Sangwan", "Seema Boora", "Saroj Ahlawat", "Anita Sheoran", "Monika Rathi"
    ],
    "Himachal Pradesh": [
        "Rohit Thakur", "Suresh Sharma", "Pankaj Verma", "Vinod Rana", "Arun Chandel",
        "Ashwani Katoch", "Sanjeev Negi", "Rakesh Dogra", "Naresh Jaswal", "Rajesh Pathania",
        "Shalini Thakur", "Reena Sharma", "Bandana Verma", "Deepika Rana", "Shilpa Chandel",
        "Anjana Katoch", "Tanuja Negi", "Shivani Dogra", "Anu Jaswal", "Jyoti Pathania"
    ],
    "Jharkhand": [
        "Birsa Munda", "Sanjay Oraon", "Manoj Soren", "Shashi Mahto", "Arvind Tirkey",
        "Deepak Kerketta", "Subhash Murmu", "Ajay Hansda", "Sunil Singh", "Pramod Prasad",
        "Sushila Munda", "Neelam Oraon", "Anita Soren", "Pratibha Mahto", "Usha Tirkey",
        "Sangeeta Kerketta", "Basanti Murmu", "Punam Hansda", "Anima Singh", "Rita Prasad"
    ],
    "Karnataka": [
        "Chethan Gowda", "Darshan Hegde", "Manjunath Shetty", "Praveen Rao", "Santosh Patil",
        "Girish Bhat", "Raghu Kulkarni", "Vinay Nayak", "Harish Kamat", "Naveen Deshpande",
        "Spoorthi Gowda", "Sowmya Hegde", "Sahana Shetty", "Tejaswini Rao", "Deepa Patil",
        "Shwetha Bhat", "Meghana Kulkarni", "Divya Nayak", "Chaitra Kamat", "Bhavya Deshpande"
    ],
    "Kerala": [
        "Rahul Nair", "Vishnu Menon", "Akhil Pillai", "Jithin Nambiar", "Arun Kurup",
        "Midhun Varma", "Amal Thomas", "Sreejith Joseph", "Anoop George", "Gokul Varghese",
        "Anju Nair", "Arya Menon", "Athira Pillai", "Reshma Nambiar", "Gopika Kurup",
        "Sreelekshmi Varma", "Haritha Thomas", "Divya Joseph", "Sneha George", "Parvathy Varghese"
    ],
    "Madhya Pradesh": [
        "Shivendra Chouhan", "Narendra Shukla", "Digvijay Dubey", "Kamlesh Tiwari", "Kailash Tomar",
        "Abhishek Saxena", "Mayank Agrawal", "Ankit Malviya", "Gaurav Patidar", "Shubham Solanki",
        "Varsha Chouhan", "Neetu Shukla", "Sadhana Dubey", "Preeti Tiwari", "Richa Tomar",
        "Garima Saxena", "Sonali Agrawal", "Shivani Malviya", "Namrata Patidar", "Pragya Solanki"
    ],
    "Maharashtra": [
        "Sachin Deshmukh", "Amol Patil", "Pradeep Kulkarni", "Rohan Joshi", "Swapnil Shinde",
        "Tushar Pawar", "Nitin Gaikwad", "Ganesh Jadhav", "Mangesh More", "Sagar Sawant",
        "Snehal Deshmukh", "Pallavi Patil", "Ashwini Kulkarni", "Rupali Joshi", "Sayali Shinde",
        "Pratiksha Pawar", "Tanvi Gaikwad", "Shweta Jadhav", "Manasi More", "Priyanka Sawant"
    ],
    "Manipur": [
        "Tomba Singh", "Chaoba Devi", "Ibohal Meitei", "Sanatomba Sharma", "Ibomcha Luwang",
        "Rajen Mangang", "Biren Khuman", "Hemanta Ningthouja", "Joykumar Haobam", "Nongmaithem Laishram",
        "Linthoingambi Singh", "Thoibi Devi", "Bembem Meitei", "RK Sanatombi Sharma", "Yaiphabi Luwang",
        "Lemba Mangang", "Memcha Khuman", "Premila Ningthouja", "Sophia Haobam", "Romila Laishram"
    ],
    "Meghalaya": [
        "Purno Sangma", "Kyrmen Marak", "Banrap Momin", "Marbud Shullai", "Wanphrang Lyngdoh",
        "Dapbiang Kharbangar", "Donald Nongrum", "Ferdinand Syiem", "Shining Warjri", "Pynskhem Dkhar",
        "Ibadaris Sangma", "Wanrida Marak", "Daphisabet Momin", "Bakynsai Shullai", "Philamon Lyngdoh",
        "Daphilashisha Kharbangar", "Ibalari Nongrum", "Larisa Syiem", "Cynthia Warjri", "Mary Dkhar"
    ],
    "Mizoram": [
        "Lalduhawma Ralte", "Vanlalpeka Sailo", "Zoramthanga Khiangte", "Lalthanpuia Hmar", "Malsawmtluanga Pachuau",
        "Lalhminghlua Chhangte", "Lalremruata Fanai", "David Hauhnar", "Samuel Zadeng", "Isaac Tochhawng",
        "Lalnuntluangi Ralte", "Lalhlimpuii Sailo", "Zodinpuii Khiangte", "Malsawmdawngzeli Hmar", "Vanlalhruaii Pachuau",
        "Rualkhumi Chhangte", "Lalrinmawii Fanai", "Ruthi Hauhnar", "Esther Zadeng", "Deborah Tochhawng"
    ],
    "Nagaland": [
        "Kevichusa Jamir", "Neiphiu Ao", "Temjen Angami", "Tokheho Sema", "Rhuguo Lotha",
        "Imkong Konyak", "Tiatemsu Zeliang", "Moatoshi Chakhesang", "Vikato Chang", "Kaito Phom",
        "Arenla Jamir", "Chubala Ao", "Sentila Angami", "Asungla Sema", "Alemla Lotha",
        "Imnasenla Konyak", "Visheli Zeliang", "Vikuonuo Chakhesang", "Neilazonuo Chang", "Atuonuo Phom"
    ],
    "Odisha": [
        "Subrat Kumar Jena", "Priyanka Mohapatra", "Soumya Ranjan Das", "Lipika Patnaik", "Debashis Mishra",
        "Ananya Sahoo", "Rakesh Kumar Rout", "Smaranika Pradhan", "Ashish Mohanty", "Biswajit Nayak",
        "Tapasi Barik", "Pradeep Kumar Behera", "Monali Samantaray", "Satya Narayan Tripathy", "Madhusmita Senapati",
        "Chandan Sekhar Panda", "Sweta Snigdha Ray", "Deepak Kumar Sethi", "Jayashree Biswal", "Manas Ranjan Mallick"
    ],
    "Punjab": [
        "Harpreet Singh", "Gurpreet Kaur", "Manpreet Dhillon", "Jaswinder Sandhu", "Sukhwinder Grewal",
        "Balwinder Gill", "Daljit Sidhu", "Navjot Brar", "Amandeep Bajwa", "Ravinder Cheema",
        "Simran Singh", "Jasleen Kaur", "Harleen Dhillon", "Kamaljit Sandhu", "Kulwant Grewal",
        "Gurjit Gill", "Paramjit Sidhu", "Kirandeep Brar", "Amanat Bajwa", "Amanpreet Cheema"
    ],
    "Rajasthan": [
        "Mahipal Rathore", "Bhanwar Shekhawat", "Gajendra Chauhan", "Surendra Gehlot", "Raghuveer Bhati",
        "Mahendra Meena", "Omendra Bishnoi", "Shaitan Sharma", "Dilip Jangid", "Devendra Choudhary",
        "Chanda Rathore", "Kamla Shekhawat", "Santosh Chauhan", "Manju Gehlot", "Saroj Bhati",
        "Vimla Meena", "Geeta Bishnoi", "Pushpa Sharma", "Bhagwati Jangid", "Urmila Choudhary"
    ],
    "Sikkim": [
        "Karma Lepcha", "Pemba Bhutia", "Tshering Subba", "Sonam Rai", "Dawa Gurung",
        "Phurba Tamang", "Lhakpa Chettri", "Norbu Pradhan", "Pasang Sharma", "Dorjee Basnet",
        "Dolma Lepcha", "Yangchen Bhutia", "Pema Subba", "Choden Rai", "Dechen Gurung",
        "Diki Tamang", "Sangita Chettri", "Mingma Pradhan", "Rinzing Sharma", "Chungda Basnet"
    ],
    "Tamil Nadu": [
        "Karthik Sundaram", "Vignesh Natarajan", "Saravanan Subramanian", "Murugan Balasubramanian", "Senthil Ramanathan",
        "Anand Venkataraman", "Balaji Krishnan", "Dhanush Pillai", "Vijay Mudaliar", "Ajith Chettiar",
        "Priya Sundaram", "Soundarya Natarajan", "Kousalya Subramanian", "Abirami Balasubramanian", "Revathi Ramanathan",
        "Meenakshi Venkataraman", "Janani Krishnan", "Nithya Pillai", "Pavithra Mudaliar", "Gayathri Chettiar"
    ],
    "Telangana": [
        "Mahesh Rao", "Chandrasekhar Reddy", "Praveen Goud", "Sravan Mudhiraj", "Srikant Yadav",
        "Mallesh Chary", "Srinivas Varma", "Vamshi Munnuru", "Naresh Padmashali", "Rajesh Kuruma",
        "Keerthana Rao", "Pranathi Reddy", "Tejaswi Goud", "Sirisha Mudhiraj", "Mounika Yadav",
        "Harini Chary", "Ramya Varma", "Sravani Munnuru", "Swathi Padmashali", "Ananya Kuruma"
    ],
    "Tripura": [
        "Biplab Debbarma", "Manik Reang", "Sudip Tripura", "Tapas Jamatia", "Subal Chakma",
        "Sukhamoy Roy", "Dulal Bhowmik", "Joydeep Das", "Pradip Bhattacharjee", "Samir Saha",
        "Purnima Debbarma", "Jharna Reang", "Kalyani Tripura", "Swapna Jamatia", "Mithu Chakma",
        "Debjani Roy", "Rita Bhowmik", "Monalisa Das", "Alpana Bhattacharjee", "Sumita Saha"
    ],
    "Uttar Pradesh": [
        "Anurag Shukla", "Akhilesh Mishra", "Dharmendra Tiwari", "Shivam Tripathi", "Ashutosh Pandey",
        "Harish Yadav", "Saurabh Singh", "Sandeep Dixit", "Prateek Chaturvedi", "Gaurav Srivastava",
        "Pratibha Shukla", "Shradha Mishra", "Vandana Tiwari", "Garima Tripathi", "Rashmi Pandey",
        "Ankita Yadav", "Shweta Singh", "Archana Dixit", "Shalini Chaturvedi", "Divya Srivastava"
    ],
    "Uttarakhand": [
        "Pushkar Rawat", "Harish Negi", "Bipin Bisht", "Tribhuvan Joshi", "Chandra Bhatt",
        "Devendra Khanduri", "Mohan Panwar", "Bhagat Nautiyal", "Trilok Bahuguna", "Narendra Semwal",
        "Kamla Rawat", "Basanti Negi", "Tara Bisht", "Pushpa Joshi", "Shanti Bhatt",
        "Uma Khanduri", "Sunita Panwar", "Mamta Nautiyal", "Deepa Bahuguna", "Geeta Semwal"
    ],
    "West Bengal": [
        "Sourav Banerjee", "Subrata Chatterjee", "Anirban Mukherjee", "Debabrata Ganguly", "Tanmoy Ghosh",
        "Sayan Bose", "Arnab Sen", "Dipankar Dasgupta", "Prosenjit Dutta", "Kaushik Chakraborty",
        "Moumita Banerjee", "Debolina Chatterjee", "Payel Mukherjee", "Sarmistha Ganguly", "Priyanka Ghosh",
        "Sreeja Bose", "Anindita Sen", "Madhumita Dasgupta", "Swagata Dutta", "Rupa Chakraborty"
    ],
    "Delhi (NCT)": [
        "Raghav Kapoor", "Kabir Malhotra", "Aditya Khanna", "Siddharth Arora", "Rohan Sethi",
        "Varun Grover", "Kunal Batra", "Sameer Mehra", "Ayush Chawla", "Naman Bhasin",
        "Tanya Kapoor", "Rhea Malhotra", "Kritika Khanna", "Simran Arora", "Ananya Sethi",
        "Meher Grover", "Ishita Batra", "Riya Mehra", "Avani Chawla", "Khushi Bhasin"
    ],
    "Chandigarh": [
        "Gurmukh Ahluwalia", "Tejinder Randhawa", "Armaan Grewal", "Zorawar Bains", "Fateh Virk",
        "Angad Mann", "Kabir Dhillon", "Samar Sandhu", "Sartaj Kahlon", "Harman Sekhon",
        "Sehaj Ahluwalia", "Jasmeen Randhawa", "Simrat Grewal", "Prabhnoor Bains", "Gurnoor Virk",
        "Nimrat Mann", "Inayat Dhillon", "Avneet Sandhu", "Ruhani Kahlon", "Mehr Sekhon"
    ],
    "Jammu and Kashmir": [
        "Tariq Lone", "Farooq Bhat", "Bashir Mir", "Altaf Dar", "Zahoor Wani",
        "Bilal Shah", "Mushtaq Rather", "Shabir Malik", "Aadil Naik", "Owais Sofi",
        "Nusrat Lone", "Shaheen Bhat", "Farhat Mir", "Shazia Dar", "Rubina Wani",
        "Asifa Shah", "Tabasum Rather", "Nadia Malik", "Uzma Naik", "Nighat Sofi"
    ],
    "Ladakh": [
        "Stanzin Namgyal", "Jigmet Angchok", "Skarma Spaldon", "Rigzin Morup", "Tsewang Stobdan",
        "Sonam Takpa", "Tashi Gialson", "Tsering Gurmet", "Dorjay Chosdup", "Lobzang Dorje",
        "Diskit Namgyal", "Dechen Angchok", "Kunzang Spaldon", "Stanzing Morup", "Yangdol Stobdan",
        "Angmo Takpa", "Dolker Gialson", "Zomskyid Gurmet", "Padma Chosdup", "Chuskit Dorje"
    ],
    "Puducherry": [
        "Jean Coumar", "Pierre Calve", "Selvam Subramanian", "Elumalai Pillai", "Murugesan Mudaliar",
        "Thangavel Gounder", "Gunasekaran Naicker", "Arul Reddiar", "Vignesh Chettiar", "Senthil Anand",
        "Marie Coumar", "Jacqueline Calve", "Suganya Subramanian", "Malathi Pillai", "Kalpana Mudaliar",
        "Vasanthi Gounder", "Sivagami Naicker", "Devi Reddiar", "Rajeswari Chettiar", "Selvi Anand"
    ],
    "Andaman and Nicobar Islands": [
        "Subhash Mondal", "Ashok Biswas", "Biswanath Halder", "Sanjeev Roy", "Jagdish Bepari",
        "Somesh Sarkar", "Manoranjan Majumder", "Probal Gain", "Bikash Baidya", "Tarun Sikdar",
        "Shipra Mondal", "Minati Biswas", "Arundhati Halder", "Jayanti Roy", "Jharna Bepari",
        "Anjali Sarkar", "Geeta Majumder", "Sujata Gain", "Kalpana Baidya", "Madhuri Sikdar"
    ],
    "Dadra and Nagar Haveli and Daman and Diu": [
        "Nilesh Patel", "Kirit Solanki", "Dipak Dhodi", "Hasmukh Halpati", "Bhupat Varli",
        "Paresh Rohit", "Bharat Damania", "Kantilal Machhi", "Ramanlal Mitna", "Jayantibhai Kamli",
        "Hansaben Patel", "Dakshaben Solanki", "Gitaben Dhodi", "Lilaben Halpati", "Manjulaben Varli",
        "Kokilaben Rohit", "Rekhaben Damania", "Shardaben Machhi", "Ushaben Mitna", "Varshaben Kamli"
    ],
    "Lakshadweep": [
        "Mohammed Koya", "Sayed Malmi", "Cheriya Melacheri", "Kasim Manikfan", "Musthafa Raveri",
        "Haneefa Thakru", "Muthukoya Pookoya", "Attakoya Naha", "Bava Tangal", "Koya Kakkillam",
        "Fathima Koya", "Aysha Malmi", "Khadeeja Melacheri", "Mariyam Manikfan", "Raziya Raveri",
        "Jameela Thakru", "Suhara Pookoya", "Safiya Naha", "Maimoona Tangal", "Zainaba Kakkillam"
    ]
}

def clean_state_slug(state_name: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '', state_name.lower())
    return slug

def generate_pan_india_donors():
    """
    Generates 20 authentic verified donors for every one of the 36 States & UTs.
    Total = 720 donors across all of India.
    """
    json_path = Path(__file__).parent / "states_data.json"
    if not json_path.exists():
        # Fallback path if run from root
        json_path = Path("backend/app/db/states_data.json")

    with open(json_path, "r", encoding="utf-8") as f:
        states_data = json.load(f)

    all_donors = []
    global_donor_id = 101

    for state_idx, state_obj in enumerate(states_data):
        state_name = state_obj["state"]
        cities = state_obj.get("cities", [])
        if not cities:
            cities = [{"name": state_name, "lat": state_obj["lat"], "lng": state_obj["lng"]}]

        names_list = STATE_NAMES_MAP.get(state_name, [])
        state_slug = clean_state_slug(state_name)

        for donor_idx in range(20):
            # Name
            if donor_idx < len(names_list):
                full_name = names_list[donor_idx]
            else:
                full_name = f"Volunteer Donor {donor_idx+1} {state_name}"

            # Email
            # Keep original emails for Odisha demo donors if matching index
            if state_name == "Odisha" and donor_idx == 0:
                email = "subrat.jena@demo.pulseconnect.org"
            elif state_name == "Odisha" and donor_idx == 1:
                email = "priyanka.mohapatra@demo.pulseconnect.org"
            elif state_name == "Odisha" and donor_idx == 2:
                email = "soumya.das@demo.pulseconnect.org"
            else:
                name_parts = full_name.lower().split()
                sanitized_name = f"{name_parts[0]}.{name_parts[-1]}"
                email = f"{sanitized_name}.{state_slug}@demo.pulseconnect.org"

            # Valid Indian Phone Number: 10 digits starting with 9, 8, or 7
            # Formula ensures no duplicates and always strictly valid Indian mobile
            # Prefix 98/97/96 + state_idx + donor_idx
            mobile_num = 9600000000 + (state_idx * 1000000) + (donor_idx * 47311) + 12345
            phone_str = f"+91 {str(mobile_num)[:5]} {str(mobile_num)[5:]}"

            # Blood Group
            blood_group = BLOOD_GROUP_DISTRIBUTION[donor_idx % len(BLOOD_GROUP_DISTRIBUTION)]

            # City & Coordinates
            city_obj = cities[donor_idx % len(cities)]
            city_name = city_obj["name"]
            
            # Subtle realistic offset around city center (+/- ~1 km)
            lat_offset = round(((donor_idx % 5) - 2) * 0.0075, 4)
            lng_offset = round((((donor_idx * 3) % 5) - 2) * 0.0075, 4)
            lat = round(city_obj["lat"] + lat_offset, 4)
            lng = round(city_obj["lng"] + lng_offset, 4)

            # Locality
            locality_prefix = LOCALITY_PREFIXES[donor_idx % len(LOCALITY_PREFIXES)]
            locality = f"{locality_prefix}, {city_name}"

            # Availability: 18 available, 2 on cooldown
            is_available = True if donor_idx < 18 else False
            
            # Donation History
            total_donations = (donor_idx % 9) + 1
            
            # Last donation date
            month = (donor_idx % 6) + 1
            day = (donor_idx * 3 % 26) + 1
            last_date = datetime.date(2026, month, day)

            donor_dict = {
                "id": global_donor_id,
                "full_name": full_name,
                "email": email,
                "phone_number": phone_str,
                "blood_group": blood_group,
                "locality": locality,
                "city": city_name,
                "state": state_name,
                "latitude": lat,
                "longitude": lng,
                "total_donations": total_donations,
                "last_donation_date": last_date,
                "is_available": is_available,
                "is_verified": True,
                "role": "donor_acceptor"
            }
            all_donors.append(donor_dict)
            global_donor_id += 1

    return all_donors


if __name__ == "__main__":
    donors = generate_pan_india_donors()
    print(f"Generated {len(donors)} donors across 36 states!")
    state_counts = {}
    for d in donors:
        state_counts[d['state']] = state_counts.get(d['state'], 0) + 1
    print("States count check:", len(state_counts))
    assert all(c == 20 for c in state_counts.values())
    print("All 36 states have exactly 20 donors!")
