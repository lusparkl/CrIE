import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import hash_password
from .models import CriterionScore, DetectedMistake, EssayEvaluation, EssaySubmission, Prompt, User


TASK2_PROMPTS = [
    ("Free university education", "Some people believe that university education should be free for everyone. Others believe students should pay for their own education. Discuss both views and give your own opinion.", "discuss_both_views", "education"),
    ("Technology in classrooms", "Some people think that digital technology should replace printed books in schools. To what extent do you agree or disagree?", "agree_disagree", "technology"),
    ("Protecting the environment", "Many environmental problems are too large for individuals to solve and can only be addressed by governments and large companies. To what extent do you agree or disagree?", "agree_disagree", "environment"),
    ("Working from home", "More people now work from home rather than travelling to an office. Do the advantages of this development outweigh the disadvantages?", "advantages_disadvantages", "work"),
    ("Ageing populations", "In many countries, the proportion of older people is increasing. What problems does this cause, and what measures could reduce these problems?", "problem_solution", "society"),
    ("Public transport", "Some cities make public transport free in order to reduce traffic congestion. What are the advantages and disadvantages of this policy?", "advantages_disadvantages", "transport"),
    ("Preventive healthcare", "Some people believe governments should spend more on preventing illness than on treating it. To what extent do you agree or disagree?", "agree_disagree", "health"),
    ("Global culture", "Countries are becoming increasingly similar because people can buy the same products everywhere. Is this a positive or negative development?", "agree_disagree", "globalization"),
    ("News and young people", "Young people are less interested in news and current affairs than previous generations. Why is this the case, and what can be done to encourage their interest?", "two_part", "media"),
    ("Homework for children", "Some people believe school children should be given homework every day, while others think it is unnecessary. Discuss both views and give your own opinion.", "discuss_both_views", "education"),
    ("Artificial intelligence at work", "Artificial intelligence is increasingly used to perform tasks previously done by people. Why is this happening, and is it a positive or negative development?", "two_part", "technology"),
    ("Private cars in cities", "Some people think private cars should be banned from city centres. To what extent do you agree or disagree?", "agree_disagree", "transport"),
    ("Food waste", "Large amounts of food are wasted in many countries. Why does this happen, and what can individuals and governments do to reduce it?", "problem_solution", "environment"),
    ("Four-day working week", "Companies should introduce a four-day working week without reducing employees’ salaries. To what extent do you agree or disagree?", "agree_disagree", "work"),
    ("Advertising and choice", "Some people say advertising helps consumers make better choices, while others say it encourages unnecessary spending. Discuss both views and give your own opinion.", "discuss_both_views", "media"),
    ("Competitive sport at school", "Competitive sport has an important place in school education. Do you agree or disagree?", "agree_disagree", "education"),
    ("Urban green spaces", "As cities grow, parks and open spaces are sometimes used for housing. What problems can this cause, and how can cities balance these competing needs?", "problem_solution", "society"),
    ("International tourism", "International tourism brings economic benefits but can damage local cultures and environments. Do the advantages outweigh the disadvantages?", "advantages_disadvantages", "globalization"),
    ("Healthy food choices", "Despite greater knowledge about healthy eating, many people continue to make unhealthy food choices. Why is this, and what could help people change their habits?", "two_part", "health"),
    ("Career changes", "People today are likely to change careers several times during their working lives. What are the reasons for this, and is it generally a positive or negative development?", "two_part", "work"),
]

# Original practice prompts based on topic families repeatedly reported by IELTS
# candidates. Wording is original so the library does not reproduce live or
# copyrighted test items.
ADDITIONAL_TASK2_PROMPTS = [
    ("Team sports and cooperation", "Some people believe that joining a sports team is the best way for children to learn how to cooperate with others. To what extent do you agree or disagree?", "agree_disagree", "education"),
    ("The value of artists", "Scientific and technological progress shapes modern life, yet people continue to value painters, musicians and writers. What can the arts contribute that science and technology cannot?", "two_part", "culture"),
    ("Working harder than others", "In education and employment, some people consistently work harder than those around them. Why does this happen, and is working extremely hard always beneficial?", "two_part", "work"),
    ("Traditional and global clothing", "In many countries, people increasingly wear international styles instead of traditional clothing. Is this a positive or negative development?", "advantages_disadvantages", "culture"),
    ("Advertising and unnecessary purchases", "The main purpose of advertising is to persuade people to buy things they do not need. To what extent do you agree or disagree?", "agree_disagree", "media"),
    ("Non-essential air travel", "Some people argue that reducing non-essential flights would protect the environment more effectively than restricting private car use. To what extent do you agree or disagree?", "agree_disagree", "environment"),
    ("Business or history education", "Some people think society would benefit if more university students studied business rather than history. To what extent do you agree or disagree?", "agree_disagree", "education"),
    ("Public funding for artists", "Some people believe governments should financially support musicians, painters and writers, while others consider this a misuse of public money. Discuss both views and give your own opinion.", "discuss_both_views", "culture"),
    ("Migration from rural areas", "Growing numbers of people are leaving agricultural communities to work in cities. What problems can this cause, and what measures could reduce them?", "problem_solution", "society"),
    ("Diet, exercise and longevity", "Some people argue that diet and exercise are less important for a long and healthy life than other factors. To what extent do you agree or disagree?", "agree_disagree", "health"),
    ("Housing for low-income residents", "Governments should provide free housing for people who cannot afford a suitable home. To what extent do you agree or disagree?", "agree_disagree", "society"),
    ("Roads or public transport", "Some people believe wider roads are the best solution to urban congestion, while others favour investment in public transport. Discuss both views and give your own opinion.", "discuss_both_views", "transport"),
    ("Funding university subjects", "Governments with limited education budgets should give more funding to university subjects that directly support the economy. To what extent do you agree or disagree?", "agree_disagree", "education"),
    ("Famous people as role models", "Young people often admire sports and media stars who do not always behave responsibly. Why are these figures so influential, and what could help young people choose better role models?", "two_part", "media"),
    ("Technology-dependent learning", "Teenagers now rely heavily on digital technology when studying. Is this a positive or negative development?", "advantages_disadvantages", "technology"),
]

TASK2_PROMPTS += ADDITIONAL_TASK2_PROMPTS


TASK1_PROMPTS = [
    {
        "title": "Household energy sources, 2000–2025", "category": "line_chart", "topic": "environment", "visualization_type": "line",
        "instructions": "The chart below shows the percentage of households using three different energy sources between 2000 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "year", "series": [{"key": "solar", "label": "Solar", "color": "#e76f51"}, {"key": "gas", "label": "Gas", "color": "#17324d"}, {"key": "coal", "label": "Coal", "color": "#a7a29a"}], "rows": [{"year": "2000", "solar": 5, "gas": 48, "coal": 47}, {"year": "2005", "solar": 9, "gas": 51, "coal": 40}, {"year": "2010", "solar": 17, "gas": 52, "coal": 31}, {"year": "2015", "solar": 29, "gas": 49, "coal": 22}, {"year": "2020", "solar": 41, "gas": 43, "coal": 16}, {"year": "2025", "solar": 55, "gas": 35, "coal": 10}], "unit": "% of households"},
    },
    {
        "title": "Average weekly exercise by age", "category": "bar_chart", "topic": "health", "visualization_type": "bar",
        "instructions": "The bar chart compares the average number of hours per week that men and women in five age groups spent exercising in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "age", "series": [{"key": "men", "label": "Men", "color": "#17324d"}, {"key": "women", "label": "Women", "color": "#e76f51"}], "rows": [{"age": "16–24", "men": 6.2, "women": 4.8}, {"age": "25–34", "men": 4.5, "women": 4.1}, {"age": "35–44", "men": 3.4, "women": 3.8}, {"age": "45–59", "men": 3.1, "women": 3.6}, {"age": "60+", "men": 4.0, "women": 4.4}], "unit": "hours per week"},
    },
    {
        "title": "Metro systems in six cities", "category": "table", "topic": "transport", "visualization_type": "table",
        "instructions": "The table gives information about metro systems in six cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"columns": ["City", "Opened", "Route length (km)", "Annual passengers (millions)"], "rows": [["Arden", 1898, 408, 1120], ["Bellford", 1912, 296, 890], ["Creston", 1967, 214, 640], ["Dunwich", 1984, 126, 310], ["Elmstead", 2001, 88, 175], ["Fairhaven", 2015, 52, 92]]},
    },
    {
        "title": "University spending in 2005 and 2025", "category": "pie_chart", "topic": "education", "visualization_type": "pie",
        "instructions": "The two pie charts show how a university allocated its annual budget in 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"charts": [{"label": "2005", "values": [{"name": "Teaching", "value": 45}, {"name": "Research", "value": 20}, {"name": "Buildings", "value": 18}, {"name": "Technology", "value": 7}, {"name": "Other", "value": 10}]}, {"label": "2025", "values": [{"name": "Teaching", "value": 38}, {"name": "Research", "value": 24}, {"name": "Buildings", "value": 12}, {"name": "Technology", "value": 19}, {"name": "Other", "value": 7}]}]},
    },
    {
        "title": "Production of recycled paper", "category": "process", "topic": "environment", "visualization_type": "process",
        "instructions": "The diagram shows how used paper is recycled into new paper products. Summarise the information by selecting and reporting the main features.",
        "data": {"steps": [{"title": "Collection", "description": "Used paper is gathered from homes and offices"}, {"title": "Sorting", "description": "Paper is separated by grade and contaminants are removed"}, {"title": "Pulping", "description": "Water and chemicals break the paper into fibres"}, {"title": "Cleaning", "description": "Ink, staples and remaining impurities are extracted"}, {"title": "Rolling", "description": "The pulp is pressed, dried and rolled into sheets"}, {"title": "New products", "description": "The sheets are cut and made into paper goods"}]},
    },
    {
        "title": "Riverside town centre redevelopment", "category": "map", "topic": "society", "visualization_type": "map",
        "instructions": "The maps show a town centre in 2010 and after redevelopment in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"maps": [{"label": "2010", "features": [{"name": "Car park", "x": 8, "y": 12, "w": 35, "h": 25, "kind": "lot"}, {"name": "Shops", "x": 55, "y": 12, "w": 36, "h": 25, "kind": "building"}, {"name": "Main road", "x": 3, "y": 48, "w": 94, "h": 14, "kind": "road"}, {"name": "Unused land", "x": 8, "y": 72, "w": 35, "h": 20, "kind": "green"}, {"name": "Library", "x": 55, "y": 72, "w": 36, "h": 20, "kind": "building"}]}, {"label": "2025", "features": [{"name": "Apartments", "x": 8, "y": 12, "w": 35, "h": 25, "kind": "building"}, {"name": "Retail centre", "x": 55, "y": 12, "w": 36, "h": 25, "kind": "building"}, {"name": "Pedestrian avenue", "x": 3, "y": 48, "w": 94, "h": 14, "kind": "road"}, {"name": "Riverside park", "x": 8, "y": 72, "w": 35, "h": 20, "kind": "green"}, {"name": "Library & café", "x": 55, "y": 72, "w": 36, "h": 20, "kind": "building"}]}]},
    },
    {
        "title": "Online retail sales by sector", "category": "line_chart", "topic": "technology", "visualization_type": "line",
        "instructions": "The chart shows online sales as a percentage of total retail sales in four sectors from 2012 to 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "year", "series": [{"key": "electronics", "label": "Electronics", "color": "#17324d"}, {"key": "clothing", "label": "Clothing", "color": "#e76f51"}, {"key": "food", "label": "Food", "color": "#4f7c70"}, {"key": "furniture", "label": "Furniture", "color": "#b28a43"}], "rows": [{"year": "2012", "electronics": 21, "clothing": 12, "food": 3, "furniture": 7}, {"year": "2016", "electronics": 34, "clothing": 24, "food": 7, "furniture": 15}, {"year": "2020", "electronics": 53, "clothing": 46, "food": 21, "furniture": 29}, {"year": "2024", "electronics": 64, "clothing": 58, "food": 32, "furniture": 41}], "unit": "% of sector sales"},
    },
    {
        "title": "Commuting methods in three cities", "category": "bar_chart", "topic": "transport", "visualization_type": "bar",
        "instructions": "The chart compares the percentage of commuters using four forms of transport in three cities in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "mode", "series": [{"key": "northport", "label": "Northport", "color": "#17324d"}, {"key": "lakeview", "label": "Lakeview", "color": "#e76f51"}, {"key": "westhaven", "label": "Westhaven", "color": "#4f7c70"}], "rows": [{"mode": "Car", "northport": 52, "lakeview": 35, "westhaven": 44}, {"mode": "Bus", "northport": 18, "lakeview": 29, "westhaven": 22}, {"mode": "Rail", "northport": 21, "lakeview": 24, "westhaven": 12}, {"mode": "Cycling", "northport": 9, "lakeview": 12, "westhaven": 22}], "unit": "% of commuters"},
    },
    {
        "title": "Household composition", "category": "table", "topic": "society", "visualization_type": "table",
        "instructions": "The table shows the percentage of households of different types in one country in 1980, 2000 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"columns": ["Household type", "1980", "2000", "2025"], "rows": [["One person", "18%", "24%", "32%"], ["Couple, no children", "21%", "25%", "28%"], ["Couple with children", "44%", "37%", "27%"], ["Single parent", "7%", "9%", "8%"], ["Other", "10%", "5%", "5%"]]},
    },
    {
        "title": "Coffee production and distribution", "category": "process", "topic": "globalization", "visualization_type": "process",
        "instructions": "The diagram illustrates the stages in producing coffee beans and distributing roasted coffee to shops. Summarise the information by selecting and reporting the main features.",
        "data": {"steps": [{"title": "Growing", "description": "Coffee plants mature in shaded fields"}, {"title": "Harvesting", "description": "Ripe red cherries are picked"}, {"title": "Processing", "description": "Fruit is removed and beans are washed"}, {"title": "Drying", "description": "Beans dry in the sun for up to four weeks"}, {"title": "Roasting", "description": "Green beans are heated and cooled"}, {"title": "Distribution", "description": "Coffee is packed and transported to retailers"}]},
    },
]

ADDITIONAL_TASK1_PROMPTS = [
    {
        "title": "Reservoir levels in six cities", "category": "bar_chart", "topic": "environment", "visualization_type": "bar",
        "instructions": "The bar chart compares the percentage of total reservoir capacity available in six Australian cities in 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "city", "series": [{"key": "2015", "label": "2015", "color": "#8b5cf6"}, {"key": "2025", "label": "2025", "color": "#38bdf8"}], "rows": [{"city": "Alderton", "2015": 72, "2025": 61}, {"city": "Brisbane", "2015": 58, "2025": 76}, {"city": "Calder", "2015": 81, "2025": 69}, {"city": "Darwin", "2015": 47, "2025": 55}, {"city": "Epping", "2015": 64, "2025": 83}, {"city": "Fremantle", "2015": 53, "2025": 42}], "unit": "% of capacity"},
    },
    {
        "title": "Oil consumption by region, 2000–2030", "category": "line_chart", "topic": "environment", "visualization_type": "line",
        "instructions": "The line graph shows daily oil consumption in four regions between 2000 and 2020, with projections for 2030. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "year", "series": [{"key": "north_america", "label": "North America", "color": "#8b5cf6"}, {"key": "middle_east", "label": "Middle East", "color": "#38bdf8"}, {"key": "china", "label": "China", "color": "#34d399"}, {"key": "europe", "label": "Europe", "color": "#f59e0b"}], "rows": [{"year": "2000", "north_america": 20, "middle_east": 5, "china": 5, "europe": 16}, {"year": "2010", "north_america": 22, "middle_east": 8, "china": 9, "europe": 15}, {"year": "2020", "north_america": 19, "middle_east": 11, "china": 14, "europe": 13}, {"year": "2030", "north_america": 17, "middle_east": 14, "china": 19, "europe": 11}], "unit": "million barrels per day"},
    },
    {
        "title": "Income sources of a non-profit organisation", "category": "pie_chart", "topic": "society", "visualization_type": "pie",
        "instructions": "The pie charts compare the sources of income received by a non-profit organisation in 1990 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"charts": [{"label": "1990", "values": [{"name": "Government grants", "value": 42}, {"name": "Individual donations", "value": 28}, {"name": "Corporate gifts", "value": 12}, {"name": "Fundraising events", "value": 10}, {"name": "Other", "value": 8}]}, {"label": "2020", "values": [{"name": "Government grants", "value": 25}, {"name": "Individual donations", "value": 36}, {"name": "Corporate gifts", "value": 18}, {"name": "Fundraising events", "value": 16}, {"name": "Other", "value": 5}]}]},
    },
    {
        "title": "Postgraduate monthly expenditure", "category": "table", "topic": "education", "visualization_type": "table",
        "instructions": "The table compares the average monthly expenditure of postgraduate students in four cities in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"columns": ["City", "Accommodation ($)", "Food ($)", "Transport ($)", "Other ($)"], "rows": [["Hartford", 920, 310, 85, 190], ["Kingsley", 760, 295, 120, 175], ["Linton", 640, 270, 70, 160], ["Mereford", 835, 325, 105, 205]]},
    },
    {
        "title": "Children’s cultural and sporting activities", "category": "bar_chart", "topic": "education", "visualization_type": "bar",
        "instructions": "The bar chart shows the percentages of boys and girls aged 5–14 who participated in selected cultural and sporting activities in one country in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"xKey": "activity", "series": [{"key": "boys", "label": "Boys", "color": "#8b5cf6"}, {"key": "girls", "label": "Girls", "color": "#38bdf8"}], "rows": [{"activity": "Drama", "boys": 8, "girls": 17}, {"activity": "Dancing", "boys": 6, "girls": 33}, {"activity": "Music", "boys": 18, "girls": 24}, {"activity": "Art", "boys": 14, "girls": 22}, {"activity": "Sport", "boys": 67, "girls": 52}], "unit": "% of children"},
    },
    {
        "title": "City museum redevelopment", "category": "map", "topic": "culture", "visualization_type": "map",
        "instructions": "The plans show the ground floor of a city museum in 1995 and after redevelopment in 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"maps": [{"label": "1995", "features": [{"name": "Permanent gallery", "x": 6, "y": 8, "w": 38, "h": 30, "kind": "gallery"}, {"name": "Temporary gallery", "x": 56, "y": 8, "w": 38, "h": 30, "kind": "gallery"}, {"name": "Central hall", "x": 31, "y": 43, "w": 38, "h": 22, "kind": "hall"}, {"name": "Café", "x": 6, "y": 71, "w": 25, "h": 20, "kind": "service"}, {"name": "Shop", "x": 69, "y": 71, "w": 25, "h": 20, "kind": "service"}, {"name": "Entrance", "x": 38, "y": 84, "w": 24, "h": 10, "kind": "entrance"}]}, {"label": "2025", "features": [{"name": "Interactive gallery", "x": 6, "y": 8, "w": 38, "h": 30, "kind": "gallery"}, {"name": "Permanent gallery", "x": 56, "y": 8, "w": 38, "h": 30, "kind": "gallery"}, {"name": "Exhibition hall", "x": 31, "y": 43, "w": 63, "h": 22, "kind": "hall"}, {"name": "Café & terrace", "x": 6, "y": 71, "w": 25, "h": 20, "kind": "service"}, {"name": "Reception", "x": 6, "y": 43, "w": 20, "h": 22, "kind": "service"}, {"name": "Entrance", "x": 69, "y": 81, "w": 25, "h": 11, "kind": "entrance"}]}]},
    },
    {
        "title": "Public library floor plan", "category": "map", "topic": "education", "visualization_type": "map",
        "instructions": "The plans compare the layout of a public library in 1975 with its present-day layout. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "data": {"maps": [{"label": "1975", "features": [{"name": "Adult books", "x": 6, "y": 8, "w": 40, "h": 27, "kind": "books"}, {"name": "Children’s books", "x": 54, "y": 8, "w": 40, "h": 27, "kind": "books"}, {"name": "Reading tables", "x": 23, "y": 42, "w": 54, "h": 24, "kind": "hall"}, {"name": "Newspapers", "x": 6, "y": 73, "w": 27, "h": 18, "kind": "books"}, {"name": "Librarian", "x": 67, "y": 73, "w": 27, "h": 18, "kind": "service"}, {"name": "Entrance", "x": 39, "y": 84, "w": 22, "h": 10, "kind": "entrance"}]}, {"label": "Today", "features": [{"name": "Books & e-books", "x": 6, "y": 8, "w": 40, "h": 27, "kind": "books"}, {"name": "Children’s zone", "x": 54, "y": 8, "w": 40, "h": 42, "kind": "children"}, {"name": "Computer desks", "x": 6, "y": 42, "w": 40, "h": 24, "kind": "technology"}, {"name": "Café", "x": 6, "y": 73, "w": 27, "h": 18, "kind": "service"}, {"name": "Help desk", "x": 67, "y": 57, "w": 27, "h": 18, "kind": "service"}, {"name": "Entrance", "x": 67, "y": 81, "w": 27, "h": 10, "kind": "entrance"}]}]},
    },
    {
        "title": "Municipal drinking water treatment", "category": "process", "topic": "environment", "visualization_type": "process",
        "instructions": "The diagram illustrates how raw river water is treated and distributed as drinking water in a city. Summarise the information by selecting and reporting the main features.",
        "data": {"steps": [{"title": "River intake", "description": "Raw water enters through screened intake pipes", "phase": "Collection"}, {"title": "Coagulation", "description": "A coagulant is mixed in so fine particles bind together", "phase": "Treatment"}, {"title": "Sedimentation", "description": "Heavy material settles at the bottom of a tank", "phase": "Treatment"}, {"title": "Filtration", "description": "Water passes through layers of sand and carbon", "phase": "Treatment"}, {"title": "Disinfection", "description": "Ozone and a small dose of chlorine remove microorganisms", "phase": "Treatment"}, {"title": "Storage", "description": "Clean water is held in a covered reservoir", "phase": "Distribution"}, {"title": "City supply", "description": "Pumps deliver drinking water to homes and businesses", "phase": "Distribution"}]},
    },
    {
        "title": "Recycling glass bottles", "category": "process", "topic": "environment", "visualization_type": "process",
        "instructions": "The diagram shows how used glass bottles are recycled and returned to shops. Summarise the information by selecting and reporting the main features.",
        "data": {"cyclical": True, "steps": [{"title": "Collection", "description": "Used bottles are placed in public recycling containers", "phase": "Recovery"}, {"title": "Colour sorting", "description": "Glass is separated into clear, green and brown groups", "phase": "Recovery"}, {"title": "Crushing", "description": "The bottles are cleaned and broken into small pieces", "phase": "Processing"}, {"title": "Melting", "description": "Crushed glass is heated with a small amount of new material", "phase": "Processing"}, {"title": "Moulding", "description": "Molten glass is shaped into new bottles", "phase": "Manufacture"}, {"title": "Filling", "description": "The bottles are filled, sealed and labelled", "phase": "Distribution"}, {"title": "Retail", "description": "Finished products are transported back to shops", "phase": "Distribution"}]},
    },
    {
        "title": "Manufacturing instant noodles", "category": "process", "topic": "food", "visualization_type": "process",
        "instructions": "The diagram illustrates the industrial process used to manufacture cups of instant noodles. Summarise the information by selecting and reporting the main features.",
        "data": {"steps": [{"title": "Flour storage", "description": "Flour is delivered and kept in large storage silos", "phase": "Preparation"}, {"title": "Mixing", "description": "Flour is combined with water and oil in a mixer", "phase": "Preparation"}, {"title": "Rolling", "description": "The dough is pressed repeatedly into thin sheets", "phase": "Shaping"}, {"title": "Cutting", "description": "Sheets are sliced into narrow noodle strips", "phase": "Shaping"}, {"title": "Cooking", "description": "Noodle discs are cooked in oil and then dried", "phase": "Cooking"}, {"title": "Filling cups", "description": "Dried noodle portions are placed into individual cups", "phase": "Packing"}, {"title": "Finishing", "description": "Vegetables and spices are added before cups are sealed and labelled", "phase": "Packing"}]},
    },
]

TASK1_PROMPTS += ADDITIONAL_TASK1_PROMPTS


def seed_prompts(db: Session) -> None:
    existing = set(db.execute(select(Prompt.task_type, Prompt.title)).all())
    for title, instruction, category, topic in TASK2_PROMPTS:
        if ("task2", title) not in existing:
            db.add(Prompt(task_type="task2", title=title, instructions=instruction, category=category, topic=topic))
    for item in TASK1_PROMPTS:
        if ("task1", item["title"]) not in existing:
            db.add(Prompt(task_type="task1", title=item["title"], instructions=item["instructions"], category=item["category"], topic=item["topic"], visualization_type=item["visualization_type"], data_json=json.dumps(item["data"])))
    db.commit()


DEMO_TEXTS = [
    "Technology has changed the way people study, and it gives students access to more information. However, the peoples are sometimes distracted by devices. In my view, printed books still have a useful role because they help learners focus.\n\nFirstly, digital tools are convenient. A student can find articles quickly and this save time. They also make lessons more flexible for people who live far from school. For example, recorded classes allow learners to review difficult ideas.\n\nOn the other hand, screens can reduce concentration. Printed books do not send notifications, and they are easy to use without electricity. Schools should therefore combine both resources rather than remove books completely.\n\nIn conclusion, technology offers important benefits, but it should support books instead of replacing them.",
    "Working at home has become common in many industries. This development brings flexibility, although it can also create isolation. I believe the advantages are greater when companies provide clear support.\n\nThe main benefit is that workers avoid a long commute. This gives them more time for family and exercise. Employers may also spend less on offices. For instance, a small company can hire skilled staff from different regions without moving them.\n\nNevertheless, remote employees may feel disconnected and communication can be slower. New workers in particular can find it difficult to learn informal procedures. These problems can be reduced by regular video meetings and occasional office days.\n\nOverall, home working is beneficial because it saves time and widens access to jobs, provided that organisations actively maintain communication.",
    "Many cities are considering free public transport to reduce congestion. While this policy has financial costs, it can create significant social and environmental benefits.\n\nRemoving fares encourages residents to leave their cars at home, especially for short daily journeys. As a result, roads may become less crowded and air quality can improve. Free services also help low-income residents reach workplaces and education. Tallinn, for example, has used fare-free travel as part of a wider transport policy.\n\nHowever, ticket income normally funds vehicles, maintenance and staff. If passenger numbers rise rapidly without matching investment, buses may become overcrowded and unreliable. Governments would need to support the system through taxation, which some residents might oppose.\n\nIn conclusion, free public transport can be valuable, but it succeeds only when cities expand capacity and pair it with measures that discourage unnecessary car use.",
    "The chart illustrates changes in household energy use from 2000 to 2025. Overall, solar power rose markedly, while coal declined throughout the period; gas remained the leading source for much of the timeframe.\n\nIn 2000, solar accounted for only 5% of households, compared with 48% for gas and 47% for coal. Solar use then increased steadily, reaching 29% in 2015 and 55% by 2025. It overtook gas during the final five years.\n\nCoal followed the opposite pattern, falling from 47% to just 10%. Gas initially edged up to a peak of 52% in 2010, before declining to 35% at the end of the period. Thus, the combined share of fossil-fuel sources fell substantially as solar became increasingly common.",
]


def seed_demo(db: Session) -> None:
    if db.scalar(select(User.id).where(User.email == "demo@crie.app")):
        return
    legacy_user = db.scalar(select(User).where(User.email == "demo@essaytrace.app"))
    if legacy_user:
        legacy_user.email = "demo@crie.app"
        db.commit()
        return
    user = User(name="Demo Learner", email="demo@crie.app", password_hash=hash_password("Demo123!"), is_demo=True)
    db.add(user)
    db.flush()
    prompts = db.scalars(select(Prompt).order_by(Prompt.id)).all()
    chosen = [prompts[1], prompts[3], prompts[5], next(p for p in prompts if p.task_type == "task1")]
    bands = [5.5, 6.0, 6.5, 7.0]
    categories = [
        [("the peoples are", "subject_verb_agreement", "People is already plural; this phrase uses an incorrect noun form.", "people are"), ("this save time", "subject_verb_agreement", "A singular subject requires a singular verb.", "this saves time"), ("important benefits", "limited_vocabulary", "This broad phrase could be more precise.", "substantial educational benefits")],
        [("clear support", "weak_idea_development", "Explain what support means before giving examples.", "structured communication and equipment support"), ("important benefits", "limited_vocabulary", "Use more precise vocabulary for the benefit described.", "measurable productivity gains")],
        [("significant social", "limited_vocabulary", "A more specific description would make the claim stronger.", "improved access for low-income residents"), ("can be valuable", "weak_idea_development", "The conclusion could state the conditions more specifically.", "can reduce car use when service frequency increases")],
        [("rose markedly", "limited_vocabulary", "Vary trend language where appropriate.", "climbed steadily before accelerating"), ("Thus", "poor_linking", "This connector is not necessary here.", "Overall")],
    ]
    now = datetime.now(timezone.utc)
    for idx, (prompt, text, band, mistakes) in enumerate(zip(chosen, DEMO_TEXTS, bands, categories)):
        submitted = now - timedelta(days=(3 - idx) * 12)
        submission = EssaySubmission(user_id=user.id, prompt_id=prompt.id, essay_text=text, word_count=len(text.split()), started_at=submitted - timedelta(minutes=31 if prompt.task_type == "task2" else 18), submitted_at=submitted, duration_seconds=1860 if prompt.task_type == "task2" else 1080, status="completed", evaluation_mode="demo")
        db.add(submission)
        db.flush()
        evaluation = EssayEvaluation(submission_id=submission.id, overall_band=band, strengths_json=json.dumps(["A clear overall position is maintained.", "Paragraphing makes the response easy to follow."]), improvements_json=json.dumps(["Develop each main idea with more precise evidence.", "Continue expanding the range of accurate vocabulary."]))
        db.add(evaluation)
        db.flush()
        scores = [band, min(9, band + 0.5), band, max(0, band - 0.5)]
        for criterion, score in zip(["task_achievement" if prompt.task_type == "task1" else "task_response", "coherence_cohesion", "lexical_resource", "grammar"], scores):
            db.add(CriterionScore(evaluation_id=evaluation.id, criterion=criterion, band=score, explanation="The response shows developing control at this band level.", recommendation="Use a final review to make each paragraph more precise and accurate."))
        for text_fragment, category, explanation, suggestion in mistakes:
            start = text.find(text_fragment)
            if start < 0:
                start = 0
                text_fragment = text[:1]
            db.add(DetectedMistake(submission_id=submission.id, user_id=user.id, category=category, text=text_fragment, start=start, end=start + len(text_fragment), severity="medium", explanation=explanation, suggestion=suggestion, created_at=submitted))
    db.commit()


def seed_database(db: Session) -> None:
    seed_prompts(db)
    seed_demo(db)
