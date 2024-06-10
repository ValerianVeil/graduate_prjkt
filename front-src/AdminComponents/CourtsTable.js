import React from "react";
import { Button, Form, Input, notification, Popconfirm, Table, Typography, message, Popover } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, ContainerOutlined} from '@ant-design/icons';
import 'antd/dist/antd.css';
import './../App.css';
import axios from "axios";

const { Title } = Typography;
const { Column, ColumnGroup } = Table;

class CourtsTable extends React.Component {

    formRef = React.createRef();
    constructor() {
      super();
      this.state = {
        courts: [],
        visibility: false,
      }
    }

    onFinish = (values) => {
      let inputData = {
        type: values.type,
        names: []
      }
      axios.post("http://backend-address:port/courts/insert", inputData)
        .then(response => {
            message.success('Запись успешно добавлена!');
            this.getActualData();
            this.formRef.current.resetFields();
          })
        .catch(error => notification.error({placement: 'top', message: error.message}))
    }

    onFinishSub = (values) => {
    }

    courtsSubForm = (id) => {
      return (
        <>
          <Form
            onFinish={this.onFinishSub}
            ref={this.formRef}
            labelCol={{ span: 13}}
            wrapperCol={{ span: 20 }}
          >
            <Form.Item
              label='Наименование группы судов'
              name='name'
              rules={[{ required: true, message: 'Введите наименование группы судов!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">Добавить запись</Button>
            </Form.Item>
          </Form>
        </>
      )
    }

    courtsForm = () => {
      return (
        <>
          <Form
            onFinish={this.onFinish}
            ref={this.formRef}
            labelCol={{ span: 13}}
            wrapperCol={{ span: 20 }}
          >
            <Form.Item
              label='Наименование группы судов'
              name='type'
              rules={[{ required: true, message: 'Введите наименование группы судов!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">Добавить запись</Button>
            </Form.Item>
          </Form>
        </>
      )
    }

    confirmUpdateCourts = (id, values) => {
      var inputData = {
        names: values.names
      }
      axios.put("http://backend-address:port/coutrs/update/" + id)
        .then(response => message.success('Таблица обновлена'))
        .catch(error => notification.error({placement: 'top', duration: 0, message: error.response.data.message}))
    }

    confirmDeleteType = (id) => {
      axios.delete("http://backend-address:port/coutrs/delete/" + id)
        .then(response => message.success('Группа судов удалена'))
        .catch(error => notification.error({placement: 'top', duration: 0, message: error.response.data.message}))
    }

    tableFooter = () => {
      return (
        <>
          <Popover
            title='Новая група судов'
            trigger='click'
            visibility={this.state.visibility}
            onVisibleChange={(visible) => {
                this.setState({visibility: visible})
                this.formRef.current.resetFields();
              }}
            content={this.courtsForm}
          >
            <Button type='primary'>
              <PlusOutlined /> Добавить группу
            </Button>
          </Popover>
        </>
      )}

    footerExpandable = (id) => {
     return (
      <>
        <Popover
          title='Новый суд'
          trigger='click'
          visibility={this.state.visibility}
          onVisibleChange={(visible) => {
            this.setState({visibility: visible})
            this.formRef.current.resetFields();
          }}
          content={this.courtsSubForm(id)}
        >
          <Button type='primary'>
            <PlusOutlined /> Добавить суд
          </Button>
        </Popover>
      </>
    )}

    expandedRowRender = (record) => {
      var data = [];
      var id = record._id;
      record.names.map((name, i) => {
        data.push({
          key: i,
          name: name
        });
      })
        return (
          <Table
            dataSource={data}
            footer={() => this.footerExpandable(id)}
            style={{marginLeft: 30, marginRight: 30, marginBottom: 30}}
            pagination={{position: ['none', 'bottomCenter'], pageSize: 10}}
          >
            <Column title='Индекс' dataIndex='key' key='key'/>
            <Column title='Наименование суда' dataIndex='name' key='name'/>
            <Column
              title='Действия'
              key='action'
              render={(text, rec) => (
                <Popconfirm
                  title="Вы уверены, что хотите удалить данную запись?"
                  okText="Да"
                  cancelText='Нет'
                  onConfirm={()=> {this.deleteSingleCourt(rec._id)}}
                >
                  <Button danger type='text'>
                    <DeleteOutlined /> Удалить
                  </Button>
                </Popconfirm>
              )
            }
            />
          </Table>
        )
    }

    getActualData = () => {
      axios
        .get("http://backend-address:port/courts")
        .then(response => {
            this.setState({courts: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
    }

    componentDidMount() {
      axios
        .get("http://backend-address:port/courts")
        .then(response => {
            this.setState({courts: response.data});
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
          dataSource={this.state.courts}
          title={() => <Title level={4}>Список судов в базе данных</Title>}
          footer={this.tableFooter}
          style={{marginLeft: 30, marginRight: 30, marginBottom: 30}}
          pagination={{position: ['none', 'bottomCenter'], pageSize: 10}}
          expandable={{expandedRowRender: record => this.expandedRowRender(record)}}
          rowKey={(record) => record._id}
        >
          <Column title="ID типа судов" dataIndex="_id" key="id" />
          <Column
            title="Группа судов"
            dataIndex='type'
            key='type'
            sorter={(a, b) => {
              if (a.type < b.type) return -1;
              if (b.type > a.type) return 1;
              return 0;
            }}
          />
          <Column
            title='Действия'
            key='action'
            render={(text, rec) => (
              <>
                <Button type='link' onClick={() => this.confirmUpdateCourts(rec._id, rec.names)}><ContainerOutlined />Cохранить</Button>
                <Popconfirm
                  title="Вы уверены, что хотите удалить данную запись?"
                  okText="Да"
                  cancelText='Нет'
                  onConfirm={()=> {this.confirmDeleteType(rec._id)}}
                >
                  <Button danger type='text'>
                    <DeleteOutlined /> Удалить
                  </Button>
                </Popconfirm>
              </>
             )
            }
          />
        </Table>
        </>
      )
    }
  }

export default CourtsTable;
