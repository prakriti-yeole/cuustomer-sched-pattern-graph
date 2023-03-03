import { useEffect, useState } from "react";
import DayPickerInput from "react-day-picker/DayPickerInput";
import { Bar,BarChart,Cell,Label, Pie, PieChart, Sector, Tooltip, XAxis,} from "recharts";
import data from "./data.json";
import "react-day-picker/lib/style.css";
import { formatDate, parseDate } from "react-day-picker/moment";
import moment from "moment";
import "./App.scss";

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {cx,cy,midAngle,innerRadius,outerRadius,startAngle,endAngle,fill,payload,percent,value,} = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.schedule_time !== "0"
          ? `${payload.schedule_time} day${
              payload.schedule_time > 1 ? "s" : ""
            } prior`
          : `In the interval`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`slots ${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const FORMAT = "YYYY-MM-DD";
const DEFAULT_ORDERS = [
  {
    schedule_time: "Date",
    slots: 2,
  },
  {
    schedule_time: "Date",
    slots: 5,
  },
  {
    schedule_time: "Date",
    slots: 1,
  },
];
const SLOTS = [
  "12am to 3am",
  "3am to 6am",
  "6am to 9am",
  "9am to 12pm",
  "12pm to 3pm",
  "3pm to 6pm",
  "6pm to 9pm",
  "9pm to 12am",
];

function App() {
  const [value, setValue] = useState(new Date());
  const [date, setDate] = useState(null);
  const [orders, setOrders] = useState([]);

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [orders2, setOrders2] = useState([]);

  useEffect(() => {
    setDate(null);
    const schedules = {},
      newOrders = [];
    data
      .filter((order) => order.item_date === moment(value).format(FORMAT))
      .forEach((order) => {
        const date = order.schedule_time.substring(0, 10);
        const time = order.schedule_time.substring(11);
        if (schedules[date]) {
          schedules[date].count++;
          schedules[date].time.push(time);
        } else schedules[date] = { count: 1, time: [time] };
      });
    for (const key in schedules) {
      newOrders.push({
        schedule_time: key,
        slots: schedules[key].count,
        timeSlots: schedules[key].time,
      });
    }
    setOrders(newOrders);
  }, [value]);

  useEffect(() => {
    if (date) {
      setOrders((prev) => {
        const schedules = {},
          newOrders = [];
        prev
          .find((order) => order.schedule_time === date)
          .timeSlots.forEach((timeSlot) => {
            const slot = SLOTS[Math.floor(timeSlot.substring(0, 2) / 3)];
            if (schedules[slot]) {
              schedules[slot]++;
            } else schedules[slot] = 1;
          });
        for (const key in schedules) {
          newOrders.push({
            schedule_time: key,
            slots: schedules[key],
          });
        }
        return newOrders;
      });
    }
  }, [date]);

  useEffect(() => {
    if (to && from) {
      const schedules = {},
        newOrders = [];
      data
        .filter((order) => {
          return (
            moment(order.item_date).unix() <= moment(to).unix() &&
            moment(order.item_date).unix() >=
              moment(from).add(-1, "days").unix()
          );
        })
        .forEach((order) => {
          let days = moment(from).diff(
            moment(order.schedule_time.substring(0, 10)),
            "days"
          );
          if (days < 0) days = 0;
          if (schedules[days]) {
            schedules[days]++;
          } else schedules[days] = 1;
        });
      for (const key in schedules) {
        newOrders.push({
          schedule_time: key,
          slots: schedules[key],
        });
      }
      setOrders2(newOrders);
    }
  }, [to, from]);

  const modifiers = { start: from, end: to };
  let toInput;

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <div className="container">
      <div className="header">
        <DayPickerInput
          style={{ margin: "20px auto" }}
          value={value}
          format={FORMAT}
          formatDate={formatDate}
          parseDate={parseDate}
          onDayChange={setValue}
          placeholder={moment().format(FORMAT)}
        />
      </div>
      <div className={"chart"}>
        {orders.length === 0 && <div className="overlay">No schedules</div>}
        <BarChart
          width={800}
          height={300}
          data={orders.length ? orders : DEFAULT_ORDERS}
        >
          <XAxis dataKey="schedule_time">
            <Label
              className="label"
              value={date}
              offset={-10}
              position="insideBottom"
            />
          </XAxis>
          <Tooltip />
          <Bar
            onClick={(data) => {
              !SLOTS.includes(data.schedule_time) &&
                setDate(data.schedule_time);
            }}
            dataKey="slots"
            fill={"#e91e63"}
          />
        </BarChart>
      </div>
      <div className="inputFromTo">
        <DayPickerInput
          value={from}
          placeholder="From"
          format="LL"
          formatDate={formatDate}
          parseDate={parseDate}
          dayPickerProps={{
            selectedDays: [from, { from, to }],
            disabledDays: { after: to },
            toMonth: to,
            modifiers,
            onDayClick: () => toInput.getInput().focus(),
          }}
          onDayChange={setFrom}
        />
        <div> - </div>
        <span className="InputFromTo-to">
          <DayPickerInput
            ref={(el) => (toInput = el)}
            value={to}
            placeholder="To"
            format="LL"
            formatDate={formatDate}
            parseDate={parseDate}
            dayPickerProps={{
              selectedDays: [from, { from, to }],
              disabledDays: { before: from },
              modifiers,
              month: from,
              fromMonth: from,
            }}
            onDayChange={setTo}
          />
        </span>
      </div>
      <PieChart width={500} height={300} className="pie">
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={orders2}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={90}
          dataKey="slots"
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index ? "#0088FE" : "#00C49F"} />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
}

export default App;
