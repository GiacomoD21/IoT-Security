
var chartElement = document.getElementById('chart');

var chart = new Chart(chartElement.getContext('2d'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: '# of Motion Detects',
      data: [],
      backgroundColor: [ 'rgba(96, 125, 139, 0.2)' ],
      borderColor: [ 'rgba(96, 125, 139, 1)' ],
      borderWidth: 1
    }],
  },
  options: {
    responsive: true,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          stepSize: 1
        },
        scaleLabel: {
          display: true,
          fontSize: 20,
          labelString: '# of Motion Detects'
        }
      }],
      xAxes: [{
        ticks: {
          beginAtZero: true,
          stepSize: 1
        },
        scaleLabel: {
          display: true,
          fontSize: 20,
          labelString: 'Time (s)'
        }
      }]
    }
  }
});

// TODO fix bug with holes in graph

var dataIndex = 0;

function updateData() {
  if (chart.data.datasets[0].data.length <= dataIndex) {
    chart.data.labels[dataIndex] = dataIndex;
    chart.data.datasets[0].data[dataIndex] = 0;
    chart.update();
  }
  dataIndex++;
  setTimeout(updateData, 1000);
}
updateData();

new EventSource('/data').onmessage = function(ev) {
  if (chart.data.datasets[0].data[ev.data]) {
    chart.data.datasets[0].data[ev.data]++;
  } else {
    chart.data.datasets[0].data[ev.data] = 1;
  }
  chart.data.labels[ev.data] = ev.data;
  chart.update();
}