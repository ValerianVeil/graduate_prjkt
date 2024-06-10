import React from "react";
import { Button, Form, Input, notification, Card, Row, Tooltip, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';
import axios from "axios";

class Authorization extends React.Component {

    onFinish = (values) => {
      const remember = values.remember;
      if (remember) notification.success({placement: 'topLeft', message: 'Мы не забудем, что вы поставили галочку'})
      const inputData = {
        username: values.username + '@domain.local',
        password: values.password,
      };
      axios.post("http://backend-address:port/login", inputData)
        .then(response => {
              const loggedUser = response.data.displayName;
              const isAdmin = response.data.isAdmin;
              var role;
              if (isAdmin) role = "Администратор"
              else role = 'Помощник судьи'
              const userDataRes = {
                username: loggedUser,
                isAdmin: isAdmin,
                role: role
              }
              notification.success({message: 'Здравствуйте, ' + loggedUser +"!"});
              this.props.getUserData(userDataRes);
            }
          )
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.response.data.message});
        })
    }

    render() {
      return (
      <div style={{display: 'block', background: 'white'}}>
       <Row align='center'>
        <Card
          title='Вход в систему'
          style={{
            width: '650',
            margin: 30,
            border: "1px solid #A9A9A9",
          }}
        >
            <Form
              labelCol={{span: 7}}
              wrapperCol={{ span: 6 }}
              onFinish={this.onFinish}
            >
             <Tooltip placement='rightTop' title="Логин такой же, как и на компьютере, например: Admin">
              <Form.Item
                label="Пользователь:"
                name="username"
                rules={[{required: true, message: 'Введите логин!'}]}
              >
                <Input
                  style={{width: 300}}
                  placeholder="Введите логин"
                  addonAfter="@domain.local"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
             </Tooltip>
             <Tooltip placement='rightTop' title="Пароль такой же, как у компьютера">
              <Form.Item
                label="Пароль:"
                name="password"
                rules={[{required: true, message: 'Введите пароль!'}]}
              >
                <Input.Password
                  style={{width: 300}}
                  placeholder="Введите пароль"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
             </Tooltip>
              <Form.Item
                wrapperCol={{ offset: 3, span: 16 }}
                name="remember"
                valuePropName="checked"
              >
                <Checkbox disabled>Запомнить меня</Checkbox>
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 1, span: 16 }}>
                <Button type="primary" htmlType="submit">
                  Войти
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Row>
      </div>
      )
    }
}

export default Authorization;
