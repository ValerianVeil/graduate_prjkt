import React from "react";
import { Tabs } from "antd";
import 'antd/dist/antd.css';
import './../App.css';
import JudgeTable from "./JudgeTable.js";
import RoomsTable from "./RoomsTable.js";
import CourtsTable from "./CourtsTable.js"

const { TabPane } = Tabs;

class AdminPanel extends React.Component {

    componentDidMount() {
    }

    render() {
      return (
        <div style={{background: 'white'}}>
          <Tabs
            size='large'
            centered
            animated
          >
            <TabPane key='judges' tab="Судьи">
                <JudgeTable />
            </TabPane>
            <TabPane key='courts' tab="Суды">
              <CourtsTable />
            </TabPane>
            <TabPane key='rooms' tab='Залы' >
              <RoomsTable />
            </TabPane>
          </Tabs>
        </div>
      )
    }
}

export default AdminPanel;
