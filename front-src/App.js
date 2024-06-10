import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom";
import { LogoutOutlined,  ToolOutlined, TableOutlined } from '@ant-design/icons';

import Authorization from './Authorization.js';
import Application from './Application.js';
import AdminPanel from './AdminComponents/AdminPanel.js';


import { Layout, ConfigProvider, Divider, Popconfirm } from "antd";
import ruRU from 'antd/lib/locale/ru_RU';
import 'antd/dist/antd.css';
import './App.css';

const { Header, Content, Footer} = Layout;

class App extends React.Component {

  constructor() {
    super();
    this.state = {
      isLoggedIn: false,
      isAdmin: false,
      loggedUser: '',
      userRole: '',
    }
  }

  getUserData = (values) => {
      const currentUser = values;
      this.setState({
        isAdmin: currentUser.isAdmin,
        loggedUser: currentUser.username,
        userRole: currentUser.role,
        isLoggedIn: true,
        onAdminPage: false
      });
    }

  render() {
    let visibility = 'hidden';
    let adminAccess = [];
    const divider = <Divider type="vertical" style={{ backgroundColor : 'white'}} />
    if (this.state.isLoggedIn) visibility = 'visible';
    if (this.state.isAdmin) {
      if (this.state.onAdminPage)
      {
          adminAccess =<Link to='/table'><TableOutlined style={{color: 'white', fontSize: 16}} onClick={() => this.setState({onAdminPage: false})} /></Link>
      }
      else {
          adminAccess = <Link to='/admin'><ToolOutlined style={{color: 'white', fontSize: 16}} onClick={() => this.setState({onAdminPage: true})} /></Link>
      }
    };
    return (
      <ConfigProvider locale={ruRU}>
      <div className="App">
       <Router>
        <Layout>
          <Header style={{ position: 'fixed', zIndex: 100, width: '100%' }}>
            <div style={{float: 'left', color: 'white'}}>Таблица ВКС арбитражного суда</div>
            <div style={{float: 'right', color: 'white', visibility: visibility}}>
              {adminAccess}
              {divider}
              {'Пользователь: '}
              {this.state.loggedUser}
              {divider}
              {"Роль: "+ this.state.userRole}
              {divider}
              <Popconfirm
                  placement="rightBottom"
                  title="Вы хотите выйти из приложения?"
                  onConfirm={() => {
                    this.setState({
                      isLoggedIn: false,
                      loggedUser: '',
                      userRole: '',
                      isAdmin: false
                    })
                  }}
                  okText="Да"
                  cancelText="Нет"
              >
                <LogoutOutlined style={{color: 'white', fontSize: 16}}/>
              </Popconfirm>
            </div>
          </Header>
          <Content style={{ paddingTop: '128', marginTop: 64}}>
              <Routes>
                <Route path="/login" element={
                    this.state.isLoggedIn
                      ? (<Navigate to="/table" />)
                      : (<Authorization getUserData={this.getUserData} />)
                  }
                />
                <Route path="/table" element={
                    this.state.isLoggedIn
                      ? (<Application username={this.state.loggedUser} role={this.state.userRole} isAdmin={this.state.isAdmin} />)
                      : (<Navigate to="/login" />)
                  }
                />
                <Route path="/admin" element={
                    this.state.isAdmin
                      ? (<AdminPanel />)
                      : (<Navigate to="/table" />)
                    }
                />
                <Route
                  path="*"
                  element={this.state.isLoggedIn ? (<Navigate to='/table' />) : (<Navigate to="/login" /> ) }
                />
              </Routes>
          </Content>
          <Footer style={{ textAlign: 'center', position: 'fixed', bottom: 0, width: '100%', zIndex: 100}}>
            Создано на React + Ant Design
          </Footer>
        </Layout>
       </Router>
      </div>
      </ConfigProvider>

    );
  }
}

export default App;
