export default function ToursSection({ toursData }) {
  return (
    <div className="page-card">
      <div className="page-header">
        <h2>School Tours</h2>
      </div>
<div className="table-scroll-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tour</th>
            <th>Location</th>
            <th>Date</th>
            <th>Students</th>
            <th>Incharge</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {toursData.map((tour) => (
            <tr key={tour.tour_id}>
              <td>{tour.tour_name}</td>
              <td>{tour.location_name}</td>
              <td>{tour.tour_date}</td>
              <td>{tour.students_count}</td>
              <td>{tour.incharge_name}</td>
              <td>{tour.status || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}