import React from "react";
import { Button, Form, Input, notification, Tooltip, Popconfirm, Table, Typography, Popover, Space, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import 'antd/dist/antd.css';
import './../App.css';
import axios from "axios";

const { Title } = Typography;
const { Column, ColumnGroup } = Table;

class JudgeTable extends React.Component {

    formRef = React.createRef();
    constructor() {
      super();
      this.state = {
        judges: [],
        visibility: false,
      }
    }

    onFinish = (values) => {
      let inputData = {
        judgeName: values.judgeName
      }
      axios.post("http://backend-address:port/judges/insert", inputData)
        .then(response => {
            message.success('Запись успешно добавлена!');
            this.getActualData();
            this.formRef.current.resetFields();
          })
        .catch(error => notification.error({placement: 'top', message: error.message}))
    }

    jForm = () => {
      return (
        <>
          <Form
            onFinish={this.onFinish}
            ref={this.formRef}
          >
            <Form.Item
              label='Имя судьи'
              name='judgeName'
              rules={[{ required: true, message: 'Введите имя судьи!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Добавить запись</Button>
            </Form.Item>
          </Form>
        </>
      )
    }

    confirmDeleteJudge = (id) => {
      axios.delete("http://backend-address:port/judges/delete/" + id)
        .then(response => message.success('Запись удалена'))
        .catch(error => notification.error({placement: 'top', duration: 0, message: error.response.data.message}))
      this.getActualData();
    }

    getActualData = () => {
      axios
        .get("http://backend-address:port/judges")
        .then(response => {
            this.setState({judges: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
    }

    tableFooter = () => {
      return (
        <>
          <Popover
            title='Новый судья'
            trigger='click'
            visibility={this.state.visibility}
            onVisibleChange={(visible) => {
                this.setState({visibility: visible})
                this.formRef.current.resetFields();
              }}
            content={this.jForm}
          >
            <Button type='primary'>
              <PlusOutlined /> Добавить запись
            </Button>
          </Popover>
        </>
      )
    }

    componentDidMount() {
      axios
        .get("http://backend-address:port/judges")
        .then(response => {
            this.setState({judges: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
    }

    render() {

      return(
        <>
        <Table
          bordered
          dataSource={this.state.judges}
          title={() => <Title level={4}>Список судей в базе данных</Title>}
          footer={this.tableFooter}
          style={{marginLeft: 30, marginRight: 30, marginBottom: 30}}
          pagination={{position: ['none', 'bottomCenter'], pageSize: 10}}
        >
          <Column title="ID судьи" dataIndex="_id" key="id" />
          <Column
            title="Имя судьи"
            dataIndex="judgeName"
            key='judgeName'
            sorter={(a, b) => {
              if (a.judgeName < b.judgeName) return -1;
              if (b.judgeName > a.judgeName) return 1;
              return 0;
            }}
            sortOrder='ascend'
          />
          <Column
            title='Действия'
            key='action'
            render={(text, rec) => (
              <Popconfirm
                title="Вы уверены, что хотите удалить данную запись?"
                okText="Да"
                cancelText='Нет'
                onConfirm={()=> {this.confirmDeleteJudge(rec._id)}}
              >
                <Button danger type='text'>
                  <DeleteOutlined /> Удалить
                </Button>
              </Popconfirm>
             )
            }
          />
        </Table>
        </>
      )
    }
  }

export default JudgeTable;
