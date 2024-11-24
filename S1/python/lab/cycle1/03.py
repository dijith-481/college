import datetime,calendar
now = datetime.datetime.now()
print(now.strftime("%d/%m/%Y"))
print(now.strftime("%B %d, %Y"))
print(now.strftime("%H:%M:%S"))
cal = calendar.TextCalendar()
cal.prmonth(now.year,now.month)